import { ethers } from "ethers";

/**
 * Computes keccak256 hash of a string
 */
export function hashString(str) {
  if (!str) return ethers.ZeroHash;
  return ethers.keccak256(ethers.toUtf8Bytes(str));
}

/**
 * Computes standard sample ID from creator address and external barcode/label
 */
export function computeSampleId(creatorAddress, externalId) {
  if (!creatorAddress || !externalId) return ethers.ZeroHash;
  return ethers.keccak256(
    ethers.solidityPacked(["address", "string"], [creatorAddress, externalId])
  );
}

/**
 * Reads a File / Blob in the browser and produces a Keccak-256 hash
 */
export async function hashFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arrayBuffer = reader.result;
        const bytes = new Uint8Array(arrayBuffer);
        const hash = ethers.keccak256(bytes);
        resolve(hash);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Computes canonical payload hash matching SampleChain.sol:computeReportPayloadHash
 */
export function computeReportPayloadHash(sampleId, laboratory, testType, reportHash, findings, reportVersion, timestamp) {
  const coder = ethers.AbiCoder.defaultAbiCoder();
  const encoded = coder.encode(
    ["bytes32", "address", "bytes32", "bytes32", "bytes32", "uint32", "uint64"],
    [
      sampleId,
      laboratory,
      ethers.keccak256(ethers.toUtf8Bytes(testType || "")),
      reportHash,
      ethers.keccak256(ethers.toUtf8Bytes(findings || "")),
      Number(reportVersion || 1),
      BigInt(timestamp)
    ]
  );
  return ethers.keccak256(encoded);
}

/**
 * Verifies an ECDSA signature over a report payload hash against an expected laboratory address
 */
export function verifyReportSignature(payloadHash, signature, expectedSigner) {
  if (!payloadHash || !signature || !expectedSigner) {
    return { valid: false, reason: "Missing required signature verification parameters" };
  }
  try {
    const recovered = ethers.verifyMessage(ethers.getBytes(payloadHash), signature);
    const matches = recovered.toLowerCase() === expectedSigner.toLowerCase();
    return {
      valid: matches,
      recoveredSigner: recovered,
      expectedSigner,
      reason: matches
        ? "Signature verified: Authenticated by registered laboratory private key."
        : `Signature mismatch: Recovered ${recovered.slice(0, 8)}… does not match ${expectedSigner.slice(0, 8)}…`
    };
  } catch (err) {
    return { valid: false, reason: "Signature decoding failed: " + err.message };
  }
}

/**
 * Generates simulated ECDSA signature for Sandbox demonstration mode.
 * Clearly labeled as a deterministic simulated signature for offline testing.
 */
export function generateSimulatedSignature(address, payloadHash) {
  // Deterministic demo private key derived from address hash for sandbox test reproducibility
  const deterministicKey = ethers.keccak256(ethers.solidityPacked(["string", "address"], ["DEMO_SANDBOX_KEY_", address]));
  const wallet = new ethers.Wallet(deterministicKey);
  // Returns signature with wallet address matching the simulated deterministic signer
  return wallet.signMessageSync(ethers.getBytes(payloadHash));
}

/**
 * Recalculates the exact Solidity Record hash
 * keccak256(abi.encodePacked(prevHash, uint8(recType), actor, uint64(timestamp), dataHash, int32(temp), keccak256(note), keccak256(uri)))
 */
export function computeRecordHash(r) {
  const noteHash = ethers.keccak256(ethers.toUtf8Bytes(r.note || ""));
  const uriHash = ethers.keccak256(ethers.toUtf8Bytes(r.uri || ""));
  const tempVal = r.temp !== undefined && r.temp !== null ? Number(r.temp) : -2147483648; // NO_TEMP

  return ethers.keccak256(
    ethers.solidityPacked(
      ["bytes32", "uint8", "address", "uint64", "bytes32", "int32", "bytes32", "bytes32"],
      [
        r.prevHash,
        Number(r.recType),
        r.actor,
        BigInt(r.timestamp),
        r.dataHash || ethers.ZeroHash,
        tempVal,
        noteHash,
        uriHash
      ]
    )
  );
}

/**
 * Verifies the integrity of a complete history chain in JavaScript
 */
export function verifyClientChain(sampleId, history, headHash) {
  if (!history || history.length === 0) {
    return { valid: false, brokenIndex: -1, reason: "No history found" };
  }

  let prev = sampleId;

  for (let i = 0; i < history.length; i++) {
    const rec = history[i];
    if (rec.prevHash.toLowerCase() !== prev.toLowerCase()) {
      return {
        valid: false,
        brokenIndex: i,
        reason: `Previous hash mismatch at step ${i + 1}. Expected ${prev.slice(0, 10)}..., got ${rec.prevHash.slice(0, 10)}...`
      };
    }

    const calculated = computeRecordHash(rec);
    if (calculated.toLowerCase() !== rec.recordHash.toLowerCase()) {
      return {
        valid: false,
        brokenIndex: i,
        reason: `Record content hash tampered at step ${i + 1} (${rec.note || "Record"}). Signature altered!`
      };
    }

    prev = rec.recordHash;
  }

  const finalMatch = prev.toLowerCase() === headHash.toLowerCase();
  if (!finalMatch) {
    return {
      valid: false,
      brokenIndex: history.length - 1,
      reason: `Head hash anchor mismatch! Chain tip does not match committed root.`
    };
  }

  return { valid: true, brokenIndex: -1, totalSteps: history.length };
}
