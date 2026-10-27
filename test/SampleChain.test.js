const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SampleChain - Biological Specimen Chain of Custody", function () {
  let SampleChain, contract;
  let admin, hospital, lab, research, courier, auditor, unauthorized;

  const OrgType = {
    None: 0,
    Hospital: 1,
    Laboratory: 2,
    Research: 3,
    Courier: 4,
    Auditor: 5,
  };

  const Status = {
    None: 0,
    Active: 1,
    InTransit: 2,
    Quarantined: 3,
    Consumed: 4,
    Destroyed: 5,
  };

  const toBytes2 = (str) => ethers.encodeBytes32String(str).slice(0, 6);
  const dummyHash = ethers.keccak256(ethers.toUtf8Bytes("ACCREDITATION_DUMMY_2026"));

  beforeEach(async function () {
    [admin, hospital, lab, research, courier, auditor, unauthorized] = await ethers.getSigners();

    SampleChain = await ethers.getContractFactory("SampleChain");
    contract = await SampleChain.deploy();
    await contract.waitForDeployment();

    // Register active organizations
    await contract.registerOrg(hospital.address, "Metro Hospital", OrgType.Hospital, toBytes2("US"), dummyHash);
    await contract.registerOrg(lab.address, "Genomics Lab", OrgType.Laboratory, toBytes2("CH"), dummyHash);
    await contract.registerOrg(research.address, "BioResearch Inst", OrgType.Research, toBytes2("GB"), dummyHash);
    await contract.registerOrg(courier.address, "ColdRoute Courier", OrgType.Courier, toBytes2("DE"), dummyHash);
    await contract.registerOrg(auditor.address, "BioEthics Auditor", OrgType.Auditor, toBytes2("CH"), dummyHash);
  });

  describe("Governance & Organization Onboarding", function () {
    it("should set deployer as admin", async function () {
      expect(await contract.admin()).to.equal(admin.address);
    });

    it("should allow admin to register new organization", async function () {
      const orgInfo = await contract.getOrg(hospital.address);
      expect(orgInfo.name).to.equal("Metro Hospital");
      expect(orgInfo.orgType).to.equal(OrgType.Hospital);
      expect(orgInfo.active).to.be.true;
    });

    it("should revert if non-admin tries to register org", async function () {
      await expect(
        contract.connect(unauthorized).registerOrg(unauthorized.address, "Fake Lab", OrgType.Laboratory, toBytes2("US"), dummyHash)
      ).to.be.revertedWithCustomError(contract, "NotAdmin");
    });

    it("should prevent duplicate organization registration", async function () {
      await expect(
        contract.registerOrg(hospital.address, "Metro Hospital Again", OrgType.Hospital, toBytes2("US"), dummyHash)
      ).to.be.revertedWithCustomError(contract, "AlreadyRegistered");
    });

    it("should toggle org active status", async function () {
      await contract.setOrgActive(hospital.address, false);
      const orgInfo = await contract.getOrg(hospital.address);
      expect(orgInfo.active).to.be.false;

      // Suspended org cannot register sample
      const now = Math.floor(Date.now() / 1000);
      await expect(
        contract.connect(hospital).registerSample({
          externalId: "SMP-SUSPENDED",
          sampleType: "Blood",
          collectedAt: now,
          consentHash: dummyHash,
          subjectHash: dummyHash,
          note: "Should fail"
        })
      ).to.be.revertedWithCustomError(contract, "NotActiveOrg");
    });

    it("should handle emergency pause and unpause", async function () {
      await contract.pause();
      expect(await contract.paused()).to.be.true;

      await expect(
        contract.connect(hospital).registerSample({
          externalId: "SMP-PAUSED",
          sampleType: "Blood",
          collectedAt: Math.floor(Date.now() / 1000),
          consentHash: dummyHash,
          subjectHash: dummyHash,
          note: "Should fail"
        })
      ).to.be.revertedWithCustomError(contract, "ContractPaused");

      await contract.unpause();
      expect(await contract.paused()).to.be.false;
    });
  });

  describe("Sample Lifecycle & Hash Chain Provenance", function () {
    let sampleId;
    const now = Math.floor(Date.now() / 1000);

    beforeEach(async function () {
      const tx = await contract.connect(hospital).registerSample({
        externalId: "HOSP-001-EDTA",
        sampleType: "Whole Blood",
        collectedAt: now,
        consentHash: dummyHash,
        subjectHash: dummyHash,
        note: "Collected in Oncology Ward"
      });
      await tx.wait();
      sampleId = await contract.computeSampleId(hospital.address, "HOSP-001-EDTA");
    });

    it("should register sample with verified initial hash chain", async function () {
      const sample = await contract.getSample(sampleId);
      expect(sample.externalId).to.equal("HOSP-001-EDTA");
      expect(sample.custodian).to.equal(hospital.address);
      expect(sample.status).to.equal(Status.Active);

      // Verify hash chain head
      const isValid = await contract.verifyChain(sampleId);
      expect(isValid).to.be.true;
    });

    it("should log cryogenic storage with temperature", async function () {
      // temp -80°C is -800 in tenths
      await contract.connect(hospital).logStorage(sampleId, "Freezer Bay 1", -800, "Stored in Ultra-Low Freezer");
      
      const history = await contract.getHistory(sampleId);
      expect(history.length).to.equal(2);
      expect(history[1].recType).to.equal(7); // Storage
      expect(history[1].temp).to.equal(-800);

      const isValid = await contract.verifyChain(sampleId);
      expect(isValid).to.be.true;
    });

    it("should split into an aliquot (child sample)", async function () {
      const aliquotTx = await contract.connect(hospital).createAliquot(
        sampleId,
        "HOSP-001-ALIQUOT-1",
        "Blood Plasma",
        "Centrifuged 15min at 2000g"
      );
      await aliquotTx.wait();

      const childId = await contract.computeSampleId(hospital.address, "HOSP-001-ALIQUOT-1");
      const childSample = await contract.getSample(childId);
      expect(childSample.parentId).to.equal(sampleId);
      expect(childSample.sampleType).to.equal("Blood Plasma");

      const children = await contract.getChildren(sampleId);
      expect(children).to.include(childId);

      // Both parent and child chains must verify
      expect(await contract.verifyChain(sampleId)).to.be.true;
      expect(await contract.verifyChain(childId)).to.be.true;
    });

    it("should record diagnostic test with report hash", async function () {
      const testReportHash = ethers.keccak256(ethers.toUtf8Bytes("GENOMIC_PANEL_REPORT_PDF_V1"));
      
      // Laboratory records test after receiving sample or when in custody
      // Transfer to lab first
      await contract.connect(hospital).initiateTransfer(sampleId, lab.address, "Sending for NGS sequencing");
      await contract.connect(lab).acceptTransfer(sampleId, true, "Arrived intact");

      await contract.connect(lab).recordTest(sampleId, "NextGen Whole Exome Sequencing", testReportHash, "ipfs://QmSeqReport123");

      const [found, index] = await contract.verifyTestResult(sampleId, testReportHash);
      expect(found).to.be.true;
      expect(index).to.be.greaterThan(0);

      expect(await contract.verifyChain(sampleId)).to.be.true;
    });
  });

  describe("Custody Handoffs & Quarantine Behavior", function () {
    let sampleId;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      await contract.connect(hospital).registerSample({
        externalId: "SMP-LOGISTICS-01",
        sampleType: "Biopsy Specimen",
        collectedAt: now,
        consentHash: dummyHash,
        subjectHash: dummyHash,
        note: "Initial collection"
      });
      sampleId = await contract.computeSampleId(hospital.address, "SMP-LOGISTICS-01");
    });

    it("should complete two-step transfer when recipient accepts intact", async function () {
      await contract.connect(hospital).initiateTransfer(sampleId, courier.address, "Dispatch to Courier");
      
      let sample = await contract.getSample(sampleId);
      expect(sample.status).to.equal(Status.InTransit);
      expect(sample.pendingRecipient).to.equal(courier.address);

      await contract.connect(courier).acceptTransfer(sampleId, true, "Received dry ice box intact");

      sample = await contract.getSample(sampleId);
      expect(sample.status).to.equal(Status.Active);
      expect(sample.custodian).to.equal(courier.address);
      expect(sample.pendingRecipient).to.equal(ethers.ZeroAddress);

      expect(await contract.verifyChain(sampleId)).to.be.true;
    });

    it("should AUTOMATICALLY QUARANTINE sample if recipient marks damaged on arrival", async function () {
      await contract.connect(hospital).initiateTransfer(sampleId, lab.address, "Dispatch to Lab");
      
      // Lab accepts but marks damaged = false (broken seal or melted ice)
      await contract.connect(lab).acceptTransfer(sampleId, false, "Thawed out, vial cap loosened");

      const sample = await contract.getSample(sampleId);
      expect(sample.status).to.equal(Status.Quarantined);
      expect(sample.custodian).to.equal(lab.address);

      expect(await contract.verifyChain(sampleId)).to.be.true;
    });

    it("should allow auditor to release quarantined sample", async function () {
      await contract.connect(hospital).quarantine(sampleId, "Suspected temperature excursion");
      let sample = await contract.getSample(sampleId);
      expect(sample.status).to.equal(Status.Quarantined);

      // Hospital cannot release quarantine
      await expect(
        contract.connect(hospital).release(sampleId, "Hospital trying to unquarantine")
      ).to.be.revertedWithCustomError(contract, "Unauthorized");

      // Auditor releases quarantine
      await contract.connect(auditor).release(sampleId, "Thermal data logger reviewed; within acceptable limit");
      sample = await contract.getSample(sampleId);
      expect(sample.status).to.equal(Status.Active);

      expect(await contract.verifyChain(sampleId)).to.be.true;
    });

    it("should allow batch custody transfer", async function () {
      const now = Math.floor(Date.now() / 1000);
      await contract.connect(hospital).registerSample({
        externalId: "BATCH-01",
        sampleType: "Blood",
        collectedAt: now,
        consentHash: dummyHash,
        subjectHash: dummyHash,
        note: "Batch item 1"
      });
      await contract.connect(hospital).registerSample({
        externalId: "BATCH-02",
        sampleType: "Blood",
        collectedAt: now,
        consentHash: dummyHash,
        subjectHash: dummyHash,
        note: "Batch item 2"
      });

      const id1 = await contract.computeSampleId(hospital.address, "BATCH-01");
      const id2 = await contract.computeSampleId(hospital.address, "BATCH-02");

      // Batch initiate
      await contract.connect(hospital).batchInitiateTransfer([id1, id2], courier.address, "Rack #4 Dispatch");

      const s1 = await contract.getSample(id1);
      const s2 = await contract.getSample(id2);
      expect(s1.status).to.equal(Status.InTransit);
      expect(s2.status).to.equal(Status.InTransit);

      // Batch accept
      await contract.connect(courier).batchAcceptTransfer([id1, id2], [true, true], "Both vials verified");
      expect((await contract.getSample(id1)).status).to.equal(Status.Active);
      expect((await contract.getSample(id2)).status).to.equal(Status.Active);
    });

    it("should provide system statistics and paginated queries", async function () {
      const stats = await contract.getSystemStats();
      expect(stats.totalSamples).to.be.greaterThan(0);
      expect(stats.totalOrgs).to.equal(5);

      const pagedIds = await contract.getSampleIdsPaged(0, 10);
      expect(pagedIds.length).to.be.greaterThan(0);

      const history = await contract.getHistoryPaged(sampleId, 0, 5);
      expect(history.length).to.be.greaterThan(0);
    });
  });

  describe("Blind Testing & Independent Verification Layer", function () {
    let sampleId;
    let secondLab;
    const now = Math.floor(Date.now() / 1000);
    const reportHash1 = ethers.keccak256(ethers.toUtf8Bytes("EXOME_REPORT_V1_PDF"));
    const reportHash2 = ethers.keccak256(ethers.toUtf8Bytes("EXOME_RETEST_INDEPENDENT_V1_PDF"));
    const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("DISCREPANCY_ANALYSIS_EVIDENCE_2026"));

    beforeEach(async function () {
      const signers = await ethers.getSigners();
      secondLab = signers[7];
      await contract.registerOrg(secondLab.address, "Apex Secondary Lab", OrgType.Laboratory, toBytes2("FR"), dummyHash);

      // Register sample with blind identifier
      const tx = await contract.connect(hospital).registerSampleBlind({
        externalId: "HOSP-VERIFY-001",
        sampleType: "Whole Blood (EDTA)",
        collectedAt: now,
        consentHash: dummyHash,
        subjectHash: dummyHash,
        note: "Collected in Oncology with Blind ID"
      }, "BT-2026-90812");
      await tx.wait();
      sampleId = await contract.computeSampleId(hospital.address, "HOSP-VERIFY-001");

      // Transfer custody to initial lab
      await contract.connect(hospital).initiateTransfer(sampleId, lab.address, "Transfer for initial NGS");
      await contract.connect(lab).acceptTransfer(sampleId, true, "Received intact for testing");
    });

    it("should store opaque blind identifier without exposing patient PII", async function () {
      const sample = await contract.getSample(sampleId);
      expect(sample.blindId).to.equal("BT-2026-90812");
      expect(await contract.verifyChain(sampleId)).to.be.true;
    });

    it("should submit cryptographically attested report with valid ECDSA signature", async function () {
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const timestamp = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);

      const payloadHash = await contract.computeReportPayloadHash(
        sampleId,
        lab.address,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        1,
        timestamp
      );
      const signature = await lab.signMessage(ethers.getBytes(payloadHash));

      await contract.connect(lab).recordAttestedTest(
        sampleId,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        "ipfs://bafybeireport1",
        signature
      );

      const reports = await contract.getAttestedReports(sampleId);
      expect(reports.length).to.equal(1);
      expect(reports[0].laboratory).to.equal(lab.address);
      expect(reports[0].findings).to.equal("NEGATIVE");
      expect(reports[0].reportVersion).to.equal(1);
      expect(reports[0].reportHash).to.equal(reportHash1);

      expect(await contract.verifyChain(sampleId)).to.be.true;
    });

    it("should reject report if signature does not match lab wallet", async function () {
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const timestamp = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);

      const payloadHash = await contract.computeReportPayloadHash(
        sampleId,
        lab.address,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        1,
        timestamp
      );
      // Malicious or unauthorized signature from hospital instead of lab
      const forgedSignature = await hospital.signMessage(ethers.getBytes(payloadHash));

      await expect(
        contract.connect(lab).recordAttestedTest(
          sampleId,
          "NextGen Sequencing Panel",
          reportHash1,
          "NEGATIVE",
          "ipfs://bafybeireport1",
          forgedSignature
        )
      ).to.be.revertedWithCustomError(contract, "InvalidSignature");
    });

    it("should reject report submission from unauthorized non-lab account", async function () {
      // Transfer custody to courier so courier is custodian
      await contract.connect(lab).initiateTransfer(sampleId, courier.address, "Dispatch to courier");
      await contract.connect(courier).acceptTransfer(sampleId, true, "Received intact");

      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const timestamp = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);

      const payloadHash = await contract.computeReportPayloadHash(
        sampleId,
        courier.address,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        1,
        timestamp
      );
      const signature = await courier.signMessage(ethers.getBytes(payloadHash));

      await expect(
        contract.connect(courier).recordAttestedTest(
          sampleId,
          "NextGen Sequencing Panel",
          reportHash1,
          "NEGATIVE",
          "ipfs://bafybeireport1",
          signature
        )
      ).to.be.revertedWithCustomError(contract, "Unauthorized");
    });

    it("should support report versioning/supersession without deleting previous report", async function () {
      // Version 1
      let blockNum = await ethers.provider.getBlockNumber();
      let block = await ethers.provider.getBlock(blockNum);
      let ts1 = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [ts1]);

      let payloadHash1 = await contract.computeReportPayloadHash(
        sampleId,
        lab.address,
        "NextGen Sequencing Panel",
        reportHash1,
        "INCONCLUSIVE",
        1,
        ts1
      );
      let sig1 = await lab.signMessage(ethers.getBytes(payloadHash1));
      await contract.connect(lab).recordAttestedTest(
        sampleId,
        "NextGen Sequencing Panel",
        reportHash1,
        "INCONCLUSIVE",
        "ipfs://bafybeireport1",
        sig1
      );

      // Version 2 (Correction / Supersession)
      blockNum = await ethers.provider.getBlockNumber();
      block = await ethers.provider.getBlock(blockNum);
      let ts2 = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [ts2]);

      const reportHash1v2 = ethers.keccak256(ethers.toUtf8Bytes("EXOME_REPORT_V2_CORRECTED_PDF"));
      let payloadHash2 = await contract.computeReportPayloadHash(
        sampleId,
        lab.address,
        "NextGen Sequencing Panel",
        reportHash1v2,
        "NEGATIVE",
        2,
        ts2
      );
      let sig2 = await lab.signMessage(ethers.getBytes(payloadHash2));
      await contract.connect(lab).recordAttestedTest(
        sampleId,
        "NextGen Sequencing Panel",
        reportHash1v2,
        "NEGATIVE",
        "ipfs://bafybeireport1_v2",
        sig2
      );

      const reports = await contract.getAttestedReports(sampleId);
      expect(reports.length).to.equal(2);
      expect(reports[0].reportVersion).to.equal(1);
      expect(reports[0].findings).to.equal("INCONCLUSIVE");
      expect(reports[1].reportVersion).to.equal(2);
      expect(reports[1].findings).to.equal("NEGATIVE");

      expect(await contract.verifyChain(sampleId)).to.be.true;
    });

    it("should allow auditor to request independent retest with a different laboratory", async function () {
      // Lab submits initial attested report
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const timestamp = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);

      const payloadHash = await contract.computeReportPayloadHash(
        sampleId,
        lab.address,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        1,
        timestamp
      );
      const signature = await lab.signMessage(ethers.getBytes(payloadHash));
      await contract.connect(lab).recordAttestedTest(
        sampleId,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        "ipfs://bafybeireport1",
        signature
      );

      // Auditor requests independent retest assigning secondLab
      const tx = await contract.connect(auditor).requestIndependentRetest(
        sampleId,
        secondLab.address,
        "Random compliance audit selection (ISO 15189 proficiency)"
      );
      await tx.wait();

      const requests = await contract.getSampleRetestRequests(sampleId);
      expect(requests.length).to.equal(1);
      const req = await contract.getRetestRequest(requests[0]);
      expect(req.designatedLab).to.equal(secondLab.address);
      expect(req.originalLab).to.equal(lab.address);
      expect(req.completed).to.be.false;

      expect(await contract.verifyChain(sampleId)).to.be.true;
    });

    it("should REVERT if auditor tries to assign the original testing lab as the retest lab", async function () {
      // Lab submits initial report
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const timestamp = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);

      const payloadHash = await contract.computeReportPayloadHash(
        sampleId,
        lab.address,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        1,
        timestamp
      );
      const signature = await lab.signMessage(ethers.getBytes(payloadHash));
      await contract.connect(lab).recordAttestedTest(
        sampleId,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        "ipfs://bafybeireport1",
        signature
      );

      // Should fail if assigning original lab to verify itself
      await expect(
        contract.connect(auditor).requestIndependentRetest(
          sampleId,
          lab.address,
          "Attempting to retest with same lab"
        )
      ).to.be.revertedWithCustomError(contract, "RetestLabMustDiffer");
    });

    it("should REVERT if unauthorized user tries to request an independent retest", async function () {
      await expect(
        contract.connect(courier).requestIndependentRetest(
          sampleId,
          secondLab.address,
          "Unauthorized retest request"
        )
      ).to.be.revertedWithCustomError(contract, "UnauthorizedAuditor");
    });

    it("should allow second lab to complete retest after receiving sample in custody", async function () {
      // Initial test
      let blockNum = await ethers.provider.getBlockNumber();
      let block = await ethers.provider.getBlock(blockNum);
      let ts1 = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [ts1]);

      let payloadHash1 = await contract.computeReportPayloadHash(
        sampleId,
        lab.address,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        1,
        ts1
      );
      let sig1 = await lab.signMessage(ethers.getBytes(payloadHash1));
      await contract.connect(lab).recordAttestedTest(
        sampleId,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        "ipfs://bafybeireport1",
        sig1
      );

      // Auditor requests retest
      await contract.connect(auditor).requestIndependentRetest(sampleId, secondLab.address, "Routine blind audit");
      const [reqId] = await contract.getSampleRetestRequests(sampleId);

      // Lab transfers sample to secondLab via custody handoff
      await contract.connect(lab).initiateTransfer(sampleId, secondLab.address, "Secondary retest transfer");
      await contract.connect(secondLab).acceptTransfer(sampleId, true, "Seal intact, sample received cold");

      // Second lab records retest report
      blockNum = await ethers.provider.getBlockNumber();
      block = await ethers.provider.getBlock(blockNum);
      let ts2 = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [ts2]);

      const retestPayloadHash = await contract.computeReportPayloadHash(
        sampleId,
        secondLab.address,
        "Independent Retest Verification",
        reportHash2,
        "PATHOGENIC_MUTATION_DETECTED",
        1,
        ts2
      );
      const retestSig = await secondLab.signMessage(ethers.getBytes(retestPayloadHash));

      await contract.connect(secondLab).recordRetestReport(
        reqId,
        reportHash2,
        "PATHOGENIC_MUTATION_DETECTED",
        "ipfs://bafybeiretestreport2",
        retestSig
      );

      const req = await contract.getRetestRequest(reqId);
      expect(req.completed).to.be.true;
      expect(req.retestReportHash).to.equal(reportHash2);

      const reports = await contract.getAttestedReports(sampleId);
      expect(reports.length).to.equal(2);
      expect(reports[0].findings).to.equal("NEGATIVE");
      expect(reports[1].findings).to.equal("PATHOGENIC_MUTATION_DETECTED");
      expect(reports[1].isRetest).to.be.true;

      expect(await contract.verifyChain(sampleId)).to.be.true;
    });

    it("should flag a discrepancy and place sample in quarantine hold", async function () {
      // Complete initial test and retest
      let blockNum = await ethers.provider.getBlockNumber();
      let block = await ethers.provider.getBlock(blockNum);
      let ts1 = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [ts1]);

      let payloadHash1 = await contract.computeReportPayloadHash(
        sampleId,
        lab.address,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        1,
        ts1
      );
      let sig1 = await lab.signMessage(ethers.getBytes(payloadHash1));
      await contract.connect(lab).recordAttestedTest(
        sampleId,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        "ipfs://bafybeireport1",
        sig1
      );

      await contract.connect(auditor).requestIndependentRetest(sampleId, secondLab.address, "Blind retest check");
      const [reqId] = await contract.getSampleRetestRequests(sampleId);

      await contract.connect(lab).initiateTransfer(sampleId, secondLab.address, "Dispatch for retest");
      await contract.connect(secondLab).acceptTransfer(sampleId, true, "Intact receipt");

      blockNum = await ethers.provider.getBlockNumber();
      block = await ethers.provider.getBlock(blockNum);
      let ts2 = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [ts2]);

      const retestPayloadHash = await contract.computeReportPayloadHash(
        sampleId,
        secondLab.address,
        "Independent Retest Verification",
        reportHash2,
        "PATHOGENIC_MUTATION_DETECTED",
        1,
        ts2
      );
      const retestSig = await secondLab.signMessage(ethers.getBytes(retestPayloadHash));
      await contract.connect(secondLab).recordRetestReport(
        reqId,
        reportHash2,
        "PATHOGENIC_MUTATION_DETECTED",
        "ipfs://bafybeiretestreport2",
        retestSig
      );

      // Auditor flags discrepancy due to result discordance (Negative vs Pathogenic)
      const tx = await contract.connect(auditor).flagDiscrepancy(
        reqId,
        "Discordant findings: Initial reported Negative, Retest reported Pathogenic variant",
        evidenceHash,
        true // place on quarantine hold
      );
      await tx.wait();

      const sample = await contract.getSample(sampleId);
      expect(sample.status).to.equal(Status.Quarantined);

      const cases = await contract.getSampleDiscrepancyCases(sampleId);
      expect(cases.length).to.equal(1);
      const c = await contract.getDiscrepancyCase(cases[0]);
      expect(c.status).to.equal(0); // Open
      expect(c.originalLab).to.equal(lab.address);
      expect(c.retestLab).to.equal(secondLab.address);

      expect(await contract.verifyChain(sampleId)).to.be.true;
    });

    it("should FORBID original lab from resolving its own discrepancy", async function () {
      // Set up discrepancy
      let blockNum = await ethers.provider.getBlockNumber();
      let block = await ethers.provider.getBlock(blockNum);
      let ts1 = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [ts1]);

      let payloadHash1 = await contract.computeReportPayloadHash(
        sampleId,
        lab.address,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        1,
        ts1
      );
      let sig1 = await lab.signMessage(ethers.getBytes(payloadHash1));
      await contract.connect(lab).recordAttestedTest(
        sampleId,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        "ipfs://bafybeireport1",
        sig1
      );

      await contract.connect(auditor).requestIndependentRetest(sampleId, secondLab.address, "Audit");
      const [reqId] = await contract.getSampleRetestRequests(sampleId);
      await contract.connect(lab).initiateTransfer(sampleId, secondLab.address, "Dispatch");
      await contract.connect(secondLab).acceptTransfer(sampleId, true, "Intact");

      blockNum = await ethers.provider.getBlockNumber();
      block = await ethers.provider.getBlock(blockNum);
      let ts2 = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [ts2]);

      const retestPayloadHash = await contract.computeReportPayloadHash(
        sampleId,
        secondLab.address,
        "Independent Retest Verification",
        reportHash2,
        "PATHOGENIC",
        1,
        ts2
      );
      const retestSig = await secondLab.signMessage(ethers.getBytes(retestPayloadHash));
      await contract.connect(secondLab).recordRetestReport(reqId, reportHash2, "PATHOGENIC", "ipfs://report2", retestSig);

      await contract.connect(auditor).flagDiscrepancy(reqId, "Discordant result", evidenceHash, true);
      const [caseId] = await contract.getSampleDiscrepancyCases(sampleId);

      // Original lab attempts to dismiss or resolve dispute against itself
      await expect(
        contract.connect(lab).resolveDiscrepancy(
          caseId,
          1, // AffirmedOriginal
          "Original lab claims its test is the correct one",
          evidenceHash,
          true
        )
      ).to.be.revertedWithCustomError(contract, "SelfResolutionForbidden");
    });

    it("should allow auditor to resolve discrepancy with formal disposition and quarantine release", async function () {
      // Set up discrepancy
      let blockNum = await ethers.provider.getBlockNumber();
      let block = await ethers.provider.getBlock(blockNum);
      let ts1 = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [ts1]);

      let payloadHash1 = await contract.computeReportPayloadHash(
        sampleId,
        lab.address,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        1,
        ts1
      );
      let sig1 = await lab.signMessage(ethers.getBytes(payloadHash1));
      await contract.connect(lab).recordAttestedTest(
        sampleId,
        "NextGen Sequencing Panel",
        reportHash1,
        "NEGATIVE",
        "ipfs://bafybeireport1",
        sig1
      );

      await contract.connect(auditor).requestIndependentRetest(sampleId, secondLab.address, "Audit");
      const [reqId] = await contract.getSampleRetestRequests(sampleId);
      await contract.connect(lab).initiateTransfer(sampleId, secondLab.address, "Dispatch");
      await contract.connect(secondLab).acceptTransfer(sampleId, true, "Intact");

      blockNum = await ethers.provider.getBlockNumber();
      block = await ethers.provider.getBlock(blockNum);
      let ts2 = block.timestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [ts2]);

      const retestPayloadHash = await contract.computeReportPayloadHash(
        sampleId,
        secondLab.address,
        "Independent Retest Verification",
        reportHash2,
        "PATHOGENIC",
        1,
        ts2
      );
      const retestSig = await secondLab.signMessage(ethers.getBytes(retestPayloadHash));
      await contract.connect(secondLab).recordRetestReport(reqId, reportHash2, "PATHOGENIC", "ipfs://report2", retestSig);

      await contract.connect(auditor).flagDiscrepancy(reqId, "Discordant result", evidenceHash, true);
      const [caseId] = await contract.getSampleDiscrepancyCases(sampleId);

      // Auditor updates to UnderReview first
      await contract.connect(auditor).updateDiscrepancyStatus(caseId, 1, "Reviewing raw fastq and sequencing depth");

      // Auditor resolves: Affirms retest, releases quarantine
      await contract.connect(auditor).resolveDiscrepancy(
        caseId,
        2, // AffirmedRetest
        "Independent retest confirmed 80x coverage detecting low-frequency variant. Retest affirmed.",
        evidenceHash,
        true // release from quarantine
      );

      const resolvedCase = await contract.getDiscrepancyCase(caseId);
      expect(resolvedCase.status).to.equal(2); // Resolved
      expect(resolvedCase.disposition).to.equal(2); // AffirmedRetest
      expect(resolvedCase.reviewer).to.equal(auditor.address);
      expect(resolvedCase.resolvedAt).to.be.greaterThan(0);

      // Sample quarantine released back to Active
      const sample = await contract.getSample(sampleId);
      expect(sample.status).to.equal(Status.Active);

      // Complete hash chain intact
      expect(await contract.verifyChain(sampleId)).to.be.true;

      // System stats reflect verification data
      const stats = await contract.getSystemStats();
      expect(stats.totalRetestRequests).to.equal(1);
      expect(stats.resolvedDiscrepancies).to.equal(1);
    });
  });
});
