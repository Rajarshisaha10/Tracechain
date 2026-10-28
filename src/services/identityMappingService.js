/**
 * @file identityMappingService.js
 * @notice Privacy-Preserving Off-Chain Identity Mapping Service (Prototype Demonstration)
 *
 * ARCHITECTURAL PRIVACY BOUNDARY:
 *  - Public blockchain ledgers CANNOT store personally identifiable information (PII)
 *    nor raw patient identifiers. Solidity `private` variables are visible to anyone
 *    inspecting raw chain storage states or node mempools.
 *  - To comply with HIPAA §164.514, GDPR Article 9, and 21 CFR Part 11, the mapping between
 *    a patient's medical identity and the sample's Blind Testing ID MUST reside off-chain
 *    behind strict cryptographic access controls.
 *
 * PROTOTYPE IMPLEMENTATION NOTE:
 *  - This service implements an isolated demonstration store simulating a secure off-chain
 *    identity enclave. In a clinical production deployment, this layer must be backed by:
 *      1. A certified Hardware Security Module (HSM) or cloud KMS (AWS KMS / GCP Cloud KMS).
 *      2. An access-logged secure enclave (e.g. AWS Nitro Enclaves, Intel SGX) enforcing
 *         zero-knowledge proofs of authorization before unmasking.
 *      3. End-to-end encryption at rest (AES-256-GCM) with key rotation.
 *  - Do NOT represent this browser demonstration store as production-grade healthcare security.
 */

import { ethers } from "ethers";

const STORAGE_KEY = "tracechain_identity_vault_v2";

export const DEMO_SEEDS = [
  {
    externalId: "MSBC-2026-WB-001",
    blindId: "BT-2026-9081-42C1",
    patientName: "Eleanor Vance (Synthetic Demo)",
    subjectRef: "STUDY-NCT0482-P1049",
    dob: "1978-03-24",
    clinicalRequisition: "Targeted Oncology Exome Sequencing",
    collectingWard: "Oncology Surgery Ward 4B",
    creator: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  },
  {
    externalId: "MSBC-2026-AL-01",
    blindId: "BT-2026-9081-42C1-ALQ",
    patientName: "Eleanor Vance (Plasma Aliquot)",
    subjectRef: "STUDY-NCT0482-P1049",
    dob: "1978-03-24",
    clinicalRequisition: "Circulating Tumor DNA (ctDNA) Assay",
    collectingWard: "CryoBio Processing Lab 2",
    creator: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  },
  {
    externalId: "MSBC-2026-BX-04",
    blindId: "BT-2026-7812-99B3",
    patientName: "Marcus Sterling (Synthetic Demo)",
    subjectRef: "STUDY-ONCOLOGY-T04",
    dob: "1964-11-09",
    clinicalRequisition: "Histopathology & HER2 Genomic Amplification",
    collectingWard: "Surgical Suite 3",
    creator: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  },
  {
    externalId: "APEX-2026-RNA-09",
    blindId: "BT-2026-4412-10A7",
    patientName: "Clara Oswald (Synthetic Demo)",
    subjectRef: "SUBJ-GEN-008",
    dob: "1991-08-19",
    clinicalRequisition: "High-Throughput RNA-Seq Transcriptomics",
    collectingWard: "Genomics Extraction Bay",
    creator: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
  },
  {
    externalId: "MSBC-2026-DISC-07",
    blindId: "BT-2026-5501-98E2",
    patientName: "Julian Thorne (Synthetic Demo)",
    subjectRef: "STUDY-DISC-T091",
    dob: "1972-09-14",
    clinicalRequisition: "Targeted EGFR T790M Resistance Mutation Panel",
    collectingWard: "Surgical Oncology Biobank",
    creator: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  }
];

/**
 * Generates an opaque, non-identifying Blind Testing Identifier
 * Format: BT-YYYY-XXXX-XXXX (Opaque random alphanumeric entropy)
 * Does NOT encode patient name, DOB, phone number, or clinical status.
 */
export function generateBlindId() {
  const year = new Date().getFullYear();
  const randBytes = ethers.randomBytes(4);
  const hex = ethers.hexlify(randBytes).slice(2).toUpperCase();
  const part1 = hex.slice(0, 4);
  const part2 = hex.slice(4, 8);
  return `BT-${year}-${part1}-${part2}`;
}

/**
 * Reads vault state from local prototype storage and self-heals default demo seeds
 */
function readVault() {
  let vault = {};
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      vault = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[IdentityVault] Failed to read store:", err);
  }

  // Ensure default demo seeds always exist in vault
  let needsSync = false;
  DEMO_SEEDS.forEach((seed) => {
    const key = seed.blindId.toUpperCase();
    if (!vault[key]) {
      vault[key] = {
        sampleId: "",
        externalId: seed.externalId,
        blindId: key,
        creatorAddress: seed.creator.toLowerCase(),
        registeredAt: Date.now() - 86400000 * 2,
        patientData: {
          patientName: seed.patientName,
          subjectRef: seed.subjectRef,
          dob: seed.dob,
          clinicalRequisition: seed.clinicalRequisition,
          collectingWard: seed.collectingWard,
        },
        accessLog: [
          {
            action: "INITIAL_SEED_CREATED",
            actor: seed.creator,
            timestamp: Date.now() - 86400000 * 2,
          }
        ]
      };
      needsSync = true;
    }
  });

  if (needsSync && typeof localStorage !== "undefined") {
    writeVault(vault);
  }

  return vault;
}

/**
 * Persists vault state
 */
function writeVault(data) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.warn("[IdentityVault] Failed to persist store:", err);
  }
}

/**
 * Registers an off-chain identity mapping
 * @param {Object} params
 * @param {string} params.sampleId - Cryptographic on-chain sample ID
 * @param {string} params.externalId - Physical barcode
 * @param {string} params.blindId - Opaque blind testing ID
 * @param {Object} params.patientData - Patient PII (Name, Subject Ref, DOB, Notes)
 * @param {string} params.creatorAddress - Authorized collection entity address
 */
export function registerIdentityMapping({ sampleId, externalId, blindId, patientData, creatorAddress }) {
  if (!blindId || !sampleId) return;

  const vault = readVault();
  vault[blindId.toUpperCase()] = {
    sampleId,
    externalId,
    blindId: blindId.toUpperCase(),
    creatorAddress: (creatorAddress || "").toLowerCase(),
    registeredAt: Date.now(),
    patientData: {
      patientName: patientData?.patientName || "Anonymous Subject",
      subjectRef: patientData?.subjectRef || "STUDY-SUBJECT-UNDISCLOSED",
      dob: patientData?.dob || "1985-05-12",
      clinicalRequisition: patientData?.clinicalRequisition || "Standard Biomarker Surveillance",
      collectingWard: patientData?.collectingWard || "Ward 4B Oncology Extraction",
    },
    accessLog: [
      {
        action: "INITIAL_MAPPING_CREATED",
        actor: creatorAddress,
        timestamp: Date.now(),
      }
    ]
  };

  writeVault(vault);
}

/**
 * Resolves a patient identity record with role-based access enforcement
 * @param {string} blindId - Opaque blind identifier
 * @param {string} requesterAddress - Account requesting identity resolution
 * @param {number|string} requesterOrgType - OrgType (1 = Hospital, 2 = Laboratory, 3 = Research, 4 = Courier, 5 = Auditor)
 * @returns {Object} Unmasked record or blinded response
 */
export function resolveIdentity(blindId, requesterAddress = "", requesterOrgType = null) {
  if (!blindId) return null;
  const vault = readVault();
  const entry = vault[blindId.toUpperCase()];

  if (!entry) {
    return {
      blindId,
      found: false,
      masked: true,
      message: "No off-chain mapping registered in identity vault."
    };
  }

  // Access check: Only Hospital (OrgType 1), Network Admin (OrgType 0), or the exact creating organization may unmask PII.
  const isCreator = requesterAddress && entry.creatorAddress === requesterAddress.toLowerCase();
  const isAuthorizedRole = Number(requesterOrgType) === 1 || Number(requesterOrgType) === 0;

  if (isCreator || isAuthorizedRole) {
    // Record access in audit log
    entry.accessLog = entry.accessLog || [];
    entry.accessLog.push({
      action: "PII_UNMASKED_AUTHORIZED",
      actor: requesterAddress,
      timestamp: Date.now()
    });
    writeVault(vault);

    return {
      blindId,
      found: true,
      masked: false,
      externalId: entry.externalId,
      sampleId: entry.sampleId,
      registeredAt: entry.registeredAt,
      creatorAddress: entry.creatorAddress,
      patientData: entry.patientData,
      accessLog: entry.accessLog,
    };
  }

  // Restricted Access (Laboratory, Courier, Research)
  return {
    blindId,
    found: true,
    masked: true,
    reason: "BLIND_TESTING_ENFORCED",
    message: "Identity unmasking restricted. Laboratory and logistics personnel receive blind identifier only to eliminate confirmation bias and protect patient confidentiality.",
    clinicalRequisition: entry.patientData?.clinicalRequisition || "Clinical Diagnostic Analysis",
    permittedFields: {
      blindId: entry.blindId,
      clinicalRequisition: entry.patientData?.clinicalRequisition || "Clinical Diagnostic Analysis",
      collectionTimestamp: entry.registeredAt,
    }
  };
}

/**
 * Look up blind identifier by sampleId or externalId
 */
export function lookupBlindId(sampleId, externalId) {
  const vault = readVault();
  for (const key of Object.keys(vault)) {
    const item = vault[key];
    if (sampleId && item.sampleId?.toLowerCase() === sampleId.toLowerCase()) return item.blindId;
    if (externalId && item.externalId?.toLowerCase() === externalId.toLowerCase()) return item.blindId;
  }
  return null;
}

/**
 * Seed demonstration identities (kept for compatibility)
 */
export function seedDemoIdentities(initialSamples) {
  // readVault() automatically self-heals demo seeds
  readVault();
}
