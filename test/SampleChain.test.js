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
});
