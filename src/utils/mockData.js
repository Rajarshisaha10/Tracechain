import { ethers } from "ethers";
import { computeRecordHash, generateSimulatedSignature, computeReportPayloadHash } from "./crypto";
import { seedDemoIdentities } from "../services/identityMappingService";

export const DEMO_ORGS = {
  "0xAD00000000000000000000000000000000000001": {
    address: "0xAD00000000000000000000000000000000000001",
    name: "Tracechain Governance Admin",
    orgType: 0, // Admin
    orgTypeName: "Network Admin",
    country: "CH",
    active: true,
    accreditationHash: "0x" + "11".repeat(32),
    registeredAt: Date.now() - 30 * 86400000,
  },
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    name: "Memorial Sloan Bio-Center",
    orgType: 1, // Hospital
    orgTypeName: "Hospital",
    country: "US",
    active: true,
    accreditationHash: "0x" + "22".repeat(32),
    registeredAt: Date.now() - 25 * 86400000,
  },
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    name: "Apex Genomics Core Lab",
    orgType: 2, // Laboratory
    orgTypeName: "Laboratory",
    country: "CH",
    active: true,
    accreditationHash: "0x" + "33".repeat(32),
    registeredAt: Date.now() - 24 * 86400000,
  },
  "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f": {
    address: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    name: "Helvetia Independent Verification Laboratory",
    orgType: 2, // Laboratory
    orgTypeName: "Independent Verification Lab",
    country: "CH",
    active: true,
    accreditationHash: "0x" + "77".repeat(32),
    registeredAt: Date.now() - 21 * 86400000,
  },
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906": {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    name: "Cambridge BioDiscovery Institute",
    orgType: 3, // Research
    orgTypeName: "Research Facility",
    country: "GB",
    active: true,
    accreditationHash: "0x" + "44".repeat(32),
    registeredAt: Date.now() - 22 * 86400000,
  },
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65": {
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    name: "CryoTransit Cold-Chain Logistics",
    orgType: 4, // Courier
    orgTypeName: "Logistics Courier",
    country: "DE",
    active: true,
    accreditationHash: "0x" + "55".repeat(32),
    registeredAt: Date.now() - 20 * 86400000,
  },
  "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc": {
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    name: "BioEthics & Regulatory Compliance Auditor",
    orgType: 5, // Auditor
    orgTypeName: "Regulatory Auditor",
    country: "CH",
    active: true,
    accreditationHash: "0x" + "66".repeat(32),
    registeredAt: Date.now() - 18 * 86400000,
  },
};

export function buildInitialDemoState() {
  const hospital = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const lab = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const secondLab = "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f";
  const courier = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
  const auditor = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc";

  const nowSec = Math.floor(Date.now() / 1000);

  // Helper to build a chain
  const makeChain = (sampleId, recordsSpec) => {
    let prev = sampleId;
    const history = [];
    for (const spec of recordsSpec) {
      const rec = {
        recType: spec.recType,
        actor: spec.actor,
        timestamp: spec.timestamp,
        dataHash: spec.dataHash || ethers.ZeroHash,
        temp: spec.temp !== undefined ? spec.temp : -2147483648,
        note: spec.note || "",
        uri: spec.uri || "",
        prevHash: prev,
      };
      rec.recordHash = computeRecordHash(rec);
      history.push(rec);
      prev = rec.recordHash;
    }
    return { history, headHash: prev };
  };

  // Sample 1: MSBC-2026-WB-001 (Whole Blood - in transit to Apex Lab via Courier)
  const id1 = ethers.keccak256(ethers.solidityPacked(["address", "string"], [hospital, "MSBC-2026-WB-001"]));
  const consent1 = ethers.keccak256(ethers.toUtf8Bytes("CONSENT_NCT0482_SUBJECT_P1049"));
  const subject1 = ethers.keccak256(ethers.toUtf8Bytes("SUBJ_REF_ANON_9921"));

  const chain1 = makeChain(id1, [
    {
      recType: 0, // Collected
      actor: hospital,
      timestamp: nowSec - 172800,
      dataHash: consent1,
      note: "Collected at Clinical Oncology Unit 4B. Initial volume: 10 mL EDTA blood.",
    },
    {
      recType: 7, // Storage
      actor: hospital,
      timestamp: nowSec - 150000,
      temp: -800, // -80.0 C
      note: "Ultracold Freezer Unit -80C Rack 4 Shelf A",
    },
    {
      recType: 3, // TransferInitiated
      actor: hospital,
      timestamp: nowSec - 86400,
      dataHash: ethers.zeroPadValue(courier, 32),
      note: "Dispatched in dry ice shipper (AWB-99824). Target: Apex Genomics Core Lab.",
    },
    {
      recType: 4, // TransferAccepted
      actor: courier,
      timestamp: nowSec - 80000,
      dataHash: ethers.toBeHex(1, 32),
      note: "Courier custody accepted. Temperature continuous logger reads -78.8°C.",
    },
    {
      recType: 7, // Storage
      actor: courier,
      timestamp: nowSec - 40000,
      temp: -785, // -78.5 C
      note: "Cryogenic Mobile Container Transit #CT-991",
    },
    {
      recType: 3, // TransferInitiated
      actor: courier,
      timestamp: nowSec - 7200,
      dataHash: ethers.zeroPadValue(lab, 32),
      note: "Arrived at Apex Genomics facility receiving dock. Awaiting lab intake.",
    }
  ]);

  // Sample 2: MSBC-2026-AL-01 (Plasma Aliquot split from Sample 1)
  const id2 = ethers.keccak256(ethers.solidityPacked(["address", "string"], [hospital, "MSBC-2026-AL-01"]));
  const chain2 = makeChain(id2, [
    {
      recType: 2, // DerivedFrom
      actor: hospital,
      timestamp: nowSec - 140000,
      dataHash: id1,
      note: "Derived aliquot: Centrifuged 15 min at 2000g, 4°C. Aliquoted into 1.5 mL cryovial.",
    },
    {
      recType: 7, // Storage
      actor: hospital,
      timestamp: nowSec - 130000,
      temp: -800,
      note: "Ultra-Low CryoFreezer #UL-02, Box P-12",
    },
    {
      recType: 8, // Handling
      actor: hospital,
      timestamp: nowSec - 60000,
      note: "Quality control inspection: Sample volume verified 1.2 mL. No hemolysis observed.",
    }
  ]);

  // Sample 3: MSBC-2026-BX-04 (Tumor Biopsy - Quarantined due to temperature excursion)
  const id3 = ethers.keccak256(ethers.solidityPacked(["address", "string"], [hospital, "MSBC-2026-BX-04"]));
  const consent3 = ethers.keccak256(ethers.toUtf8Bytes("CONSENT_ONCOLOGY_SURGERY_T04"));
  const subject3 = ethers.keccak256(ethers.toUtf8Bytes("SUBJ_ANON_BX_481"));

  const chain3 = makeChain(id3, [
    {
      recType: 0, // Collected
      actor: hospital,
      timestamp: nowSec - 250000,
      dataHash: consent3,
      note: "Surgical tumor core biopsy specimen collected in sterile OCT compound.",
    },
    {
      recType: 7, // Storage
      actor: hospital,
      timestamp: nowSec - 200000,
      temp: -800,
      note: "Cryo Storage Bank Alpha",
    },
    {
      recType: 10, // Incident
      actor: hospital,
      timestamp: nowSec - 120000,
      dataHash: ethers.keccak256(ethers.toUtf8Bytes("EXCURSION_LOGGER_LOG_CSV")),
      note: "Thermal excursion detected: Freezer door seal compromised. Temp rose to -12°C for 45 mins.",
      uri: "ipfs://bafybeiexcursionlogdata7741",
    },
    {
      recType: 11, // Quarantined
      actor: hospital,
      timestamp: nowSec - 110000,
      note: "Placed on hold pending thermal degradation evaluation by BioEthics Compliance Auditor.",
    }
  ]);

  // Sample 4: APEX-2026-RNA-09 (RNA Extract - Tested and Active at Apex Genomics)
  const id4 = ethers.keccak256(ethers.solidityPacked(["address", "string"], [lab, "APEX-2026-RNA-09"]));
  const consent4 = ethers.keccak256(ethers.toUtf8Bytes("CONSENT_GENOMIC_SURVEILLANCE_2026"));
  const subject4 = ethers.keccak256(ethers.toUtf8Bytes("SUBJ_GEN_008"));
  const testReportHash = ethers.keccak256(ethers.toUtf8Bytes("NEXTGEN_SEQUENCING_EXOME_PANEL_REPORT_FINAL_PDF"));

  const chain4 = makeChain(id4, [
    {
      recType: 0, // Collected
      actor: lab,
      timestamp: nowSec - 300000,
      dataHash: consent4,
      note: "Extracted high-purity total RNA (RIN 9.4) from peripheral blood mononuclear cells.",
    },
    {
      recType: 7, // Storage
      actor: lab,
      timestamp: nowSec - 280000,
      temp: -800,
      note: "Genomics CryoArchive Freezer Bay 4",
    },
    {
      recType: 16, // ReportAttested
      actor: lab,
      timestamp: nowSec - 90000,
      dataHash: testReportHash,
      note: "Attested Report v1: NextGen Targeted Exome Panel (500 Genes) [NEGATIVE - NO PATHOGENIC VARIANTS]",
      uri: "ipfs://bafybeigenomicsequencingreportfinal",
    }
  ]);

  // Sample 5: MSBC-2026-DISC-07 (Demonstration Sample with Discordant Retest & Open Discrepancy Case)
  const id5 = ethers.keccak256(ethers.solidityPacked(["address", "string"], [hospital, "MSBC-2026-DISC-07"]));
  const consent5 = ethers.keccak256(ethers.toUtf8Bytes("CONSENT_CLINICAL_TRIAL_DISC07"));
  const subject5 = ethers.keccak256(ethers.toUtf8Bytes("SUBJ_DISC_4921"));
  const origReportHash = ethers.keccak256(ethers.toUtf8Bytes("ORIGINAL_LAB_REPORT_APEX_DISC07"));
  const retestReportHash = ethers.keccak256(ethers.toUtf8Bytes("INDEPENDENT_RETEST_REPORT_HELVETIA_DISC07"));
  const reqId5 = ethers.keccak256(ethers.solidityPacked(["bytes32", "string"], [id5, "RETEST_REQ_DISC07"]));
  const caseId5 = ethers.keccak256(ethers.solidityPacked(["bytes32", "string"], [reqId5, "CASE_DISC07"]));

  const chain5 = makeChain(id5, [
    {
      recType: 0, // Collected
      actor: hospital,
      timestamp: nowSec - 400000,
      dataHash: consent5,
      note: "Biopsy core extraction in Oncology. Blind ID issued.",
    },
    {
      recType: 3, // TransferInitiated
      actor: hospital,
      timestamp: nowSec - 350000,
      dataHash: ethers.zeroPadValue(lab, 32),
      note: "Dispatched to Apex Genomics Core Lab",
    },
    {
      recType: 4, // TransferAccepted
      actor: lab,
      timestamp: nowSec - 320000,
      dataHash: ethers.toBeHex(1, 32),
      note: "Apex Genomics accepted specimen intact",
    },
    {
      recType: 16, // ReportAttested
      actor: lab,
      timestamp: nowSec - 250000,
      dataHash: origReportHash,
      note: "Attested Report v1: Solid Tumor Biomarker Panel [NEGATIVE - WILD TYPE]",
      uri: "ipfs://bafybeiapexreportdisc07",
    },
    {
      recType: 17, // RetestRequested
      actor: auditor,
      timestamp: nowSec - 180000,
      dataHash: reqId5,
      note: "Independent retest requested. Assigned: Helvetia Independent Verification Laboratory | Blind compliance audit selection",
    },
    {
      recType: 3, // TransferInitiated
      actor: lab,
      timestamp: nowSec - 150000,
      dataHash: ethers.zeroPadValue(secondLab, 32),
      note: "Specimen dispatched to independent verification laboratory",
    },
    {
      recType: 4, // TransferAccepted
      actor: secondLab,
      timestamp: nowSec - 120000,
      dataHash: ethers.toBeHex(1, 32),
      note: "Helvetia Verification Lab received specimen; cryogenic seal intact",
    },
    {
      recType: 18, // RetestReported
      actor: secondLab,
      timestamp: nowSec - 60000,
      dataHash: retestReportHash,
      note: "Independent Retest Submitted [PATHOGENIC VARIANT: EGFR T790M DETECTED]",
      uri: "ipfs://bafybeihelvetiaretestdisc07",
    },
    {
      recType: 19, // DiscrepancyFlagged
      actor: auditor,
      timestamp: nowSec - 30000,
      dataHash: caseId5,
      note: "Discrepancy Investigation Opened: Divergent analytical findings. Original: Negative/WT; Retest: Pathogenic EGFR T790M positive.",
    },
    {
      recType: 11, // Quarantined
      actor: auditor,
      timestamp: nowSec - 29000,
      dataHash: ethers.ZeroHash,
      note: "Placed on hold pending independent bioethics & clinical review of discrepant assay results.",
    }
  ]);

  const samples = {
    [id1]: {
      sampleId: id1,
      externalId: "MSBC-2026-WB-001",
      blindId: "BT-2026-9081-42C1",
      sampleType: "Whole Blood (EDTA)",
      origin: hospital,
      creator: hospital,
      collectedAt: nowSec - 172800,
      consentHash: consent1,
      subjectHash: subject1,
      parentId: ethers.ZeroHash,
      custodian: courier,
      pendingRecipient: lab,
      status: 2, // InTransit
      headHash: chain1.headHash,
      baselineMetric: {
        name: "Biomarker Concentration",
        value: 50.0,
        unit: "ng/µL",
        tolerance: 15,
        expectedQualitative: "NEGATIVE"
      },
    },
    [id2]: {
      sampleId: id2,
      externalId: "MSBC-2026-AL-01",
      blindId: "BT-2026-9081-42C1-ALQ",
      sampleType: "Blood Plasma Aliquot",
      origin: hospital,
      creator: hospital,
      collectedAt: nowSec - 172800,
      consentHash: consent1,
      subjectHash: subject1,
      parentId: id1,
      custodian: hospital,
      pendingRecipient: ethers.ZeroAddress,
      status: 1, // Active
      headHash: chain2.headHash,
      baselineMetric: {
        name: "ctDNA Concentration",
        value: 12.0,
        unit: "ng/µL",
        tolerance: 15,
        expectedQualitative: "NEGATIVE"
      },
    },
    [id3]: {
      sampleId: id3,
      externalId: "MSBC-2026-BX-04",
      blindId: "BT-2026-7812-99B3",
      sampleType: "Tumor Biopsy Specimen",
      origin: hospital,
      creator: hospital,
      collectedAt: nowSec - 250000,
      consentHash: consent3,
      subjectHash: subject3,
      parentId: ethers.ZeroHash,
      custodian: hospital,
      pendingRecipient: ethers.ZeroAddress,
      status: 3, // Quarantined
      headHash: chain3.headHash,
      baselineMetric: {
        name: "Tumor Cell Purity",
        value: 75.0,
        unit: "%",
        tolerance: 10,
        expectedQualitative: "HER2-NORMAL"
      },
    },
    [id4]: {
      sampleId: id4,
      externalId: "APEX-2026-RNA-09",
      blindId: "BT-2026-4412-10A7",
      sampleType: "Total RNA Extract (High Purity)",
      origin: lab,
      creator: lab,
      collectedAt: nowSec - 300000,
      consentHash: consent4,
      subjectHash: subject4,
      parentId: ethers.ZeroHash,
      custodian: lab,
      pendingRecipient: ethers.ZeroAddress,
      status: 1, // Active
      headHash: chain4.headHash,
      baselineMetric: {
        name: "RNA Integrity (RIN)",
        value: 8.5,
        unit: "Score",
        tolerance: 10,
        expectedQualitative: "HIGH-QUALITY"
      },
    },
    [id5]: {
      sampleId: id5,
      externalId: "MSBC-2026-DISC-07",
      blindId: "BT-2026-5501-98E2",
      sampleType: "Tumor Biopsy (Core Flash-Frozen)",
      origin: hospital,
      creator: hospital,
      collectedAt: nowSec - 400000,
      consentHash: consent5,
      subjectHash: subject5,
      parentId: ethers.ZeroHash,
      custodian: secondLab,
      pendingRecipient: ethers.ZeroAddress,
      status: 3, // Quarantined pending discrepancy review
      headHash: chain5.headHash,
      baselineMetric: {
        name: "EGFR Mutation Allele Freq",
        value: 0.5,
        unit: "%",
        tolerance: 20,
        expectedQualitative: "NEGATIVE (WT)"
      },
      hasValueWarning: true,
      latestVarianceWarning: {
        measuredValue: 4.8,
        baselineValue: 0.5,
        unit: "%",
        variancePct: 860.0,
        tolerancePct: 20
      }
    }
  };

  const histories = {
    [id1]: chain1.history,
    [id2]: chain2.history,
    [id3]: chain3.history,
    [id4]: chain4.history,
    [id5]: chain5.history,
  };

  const childrenMap = {
    [id1]: [id2],
  };

  // Seed Attested Reports
  const payloadHash4 = computeReportPayloadHash(id4, lab, "NextGen Targeted Exome Panel (500 Genes)", testReportHash, "NEGATIVE", 1, nowSec - 90000);
  const sig4 = generateSimulatedSignature(lab, payloadHash4);

  const payloadHash5Orig = computeReportPayloadHash(id5, lab, "Solid Tumor Biomarker Panel", origReportHash, "NEGATIVE - WILD TYPE", 1, nowSec - 250000);
  const sig5Orig = generateSimulatedSignature(lab, payloadHash5Orig);

  const payloadHash5Retest = computeReportPayloadHash(id5, secondLab, "Independent Retest Verification", retestReportHash, "PATHOGENIC VARIANT: EGFR T790M DETECTED", 1, nowSec - 60000);
  const sig5Retest = generateSimulatedSignature(secondLab, payloadHash5Retest);

  const attestedReports = {
    [id4]: [
      {
        sampleId: id4,
        laboratory: lab,
        testType: "NextGen Targeted Exome Panel (500 Genes)",
        reportHash: testReportHash,
        findings: "NEGATIVE (No Pathogenic Alterations Detected)",
        reportVersion: 1,
        timestamp: nowSec - 90000,
        signature: sig4,
        uri: "ipfs://bafybeigenomicsequencingreportfinal",
        isRetest: false,
        originalReportHash: ethers.ZeroHash,
        measuredValue: 8.4,
        measuredUnit: "Score",
        baselineValue: 8.5,
        variancePct: -1.2,
        isOutOfTolerance: false,
      }
    ],
    [id5]: [
      {
        sampleId: id5,
        laboratory: lab,
        testType: "Solid Tumor Biomarker Panel",
        reportHash: origReportHash,
        findings: "NEGATIVE - WILD TYPE",
        reportVersion: 1,
        timestamp: nowSec - 250000,
        signature: sig5Orig,
        uri: "ipfs://bafybeiapexreportdisc07",
        isRetest: false,
        originalReportHash: ethers.ZeroHash,
      },
      {
        sampleId: id5,
        laboratory: secondLab,
        testType: "Independent Retest Verification",
        reportHash: retestReportHash,
        findings: "PATHOGENIC VARIANT: EGFR T790M DETECTED",
        reportVersion: 1,
        timestamp: nowSec - 60000,
        signature: sig5Retest,
        uri: "ipfs://bafybeihelvetiaretestdisc07",
        isRetest: true,
        originalReportHash: origReportHash,
        measuredValue: 4.8,
        measuredUnit: "%",
        baselineValue: 0.5,
        variancePct: 860.0,
        isOutOfTolerance: true,
      }
    ]
  };

  // Seed Retest Requests
  const retestRequests = {
    [reqId5]: {
      requestId: reqId5,
      sampleId: id5,
      initiator: auditor,
      originalLab: lab,
      designatedLab: secondLab,
      originalReportHash: origReportHash,
      reason: "Routine compliance verification under ISO-15189 cross-validation protocol",
      requestedAt: nowSec - 180000,
      completed: true,
      retestReportHash: retestReportHash,
    }
  };

  // Seed Discrepancy Cases
  const discrepancyCases = {
    [caseId5]: {
      caseId: caseId5,
      sampleId: id5,
      requestId: reqId5,
      originalReportHash: origReportHash,
      retestReportHash: retestReportHash,
      originalLab: lab,
      retestLab: secondLab,
      reason: "Material analytical discordance: Primary lab recorded Negative/WT; Independent retest confirmed low-frequency EGFR T790M resistance mutation.",
      evidenceHash: ethers.keccak256(ethers.toUtf8Bytes("BAM_ALIGNMENT_DIFFERENCE_PROOF_T790M")),
      status: 0, // Open
      disposition: 0, // None
      resolutionReason: "",
      reviewer: ethers.ZeroAddress,
      flaggedAt: nowSec - 30000,
      resolvedAt: 0,
      isMeasurementDiscrepancy: true,
      baselineValue: 0.5,
      measuredValue: 4.8,
      unit: "%",
      variancePct: 860.0,
      tolerancePct: 20
    }
  };

  // Seed off-chain identity mappings
  seedDemoIdentities(samples);

  return {
    orgs: DEMO_ORGS,
    samples,
    histories,
    childrenMap,
    allSampleIds: [id1, id2, id3, id4, id5],
    attestedReports,
    retestRequests,
    sampleRetestRequests: { [id5]: [reqId5] },
    allRetestRequestIds: [reqId5],
    discrepancyCases,
    sampleDiscrepancyCases: { [id5]: [caseId5] },
    allDiscrepancyCaseIds: [caseId5],
    paused: false,
  };
}
