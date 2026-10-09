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
