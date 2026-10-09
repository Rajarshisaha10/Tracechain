/**
 * Truncates an Ethereum address or hash for display
 */
export function shortHash(hash, chars = 6) {
  if (!hash) return "";
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}…${hash.slice(-chars)}`;
}

/**
 * Formats unix timestamp (seconds or milliseconds) to readable date
 */
export function formatTimestamp(ts) {
  if (!ts) return "N/A";
  const num = Number(ts);
  const ms = num < 10000000000 ? num * 1000 : num;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

/**
 * Formats temperature in tenths of a degree Celsius (int32)
 */
export function formatTemp(tempCx10) {
  if (tempCx10 === undefined || tempCx10 === null || Number(tempCx10) === -2147483648) {
    return "N/A";
  }
  const celsius = Number(tempCx10) / 10;
  return `${celsius.toFixed(1)} °C`;
}

/**
 * Formats record type enum to friendly string
 */
export const RECORD_TYPE_NAMES = [
  "Collected",          // 0
  "Aliquot Created",    // 1
  "Derived From",       // 2
  "Transfer Initiated", // 3
  "Transfer Accepted",  // 4
  "Transfer Rejected",  // 5
  "Transfer Cancelled", // 6
  "Storage Logged",     // 7
  "Handling Action",    // 8
  "Lab Test Recorded",  // 9
  "Incident Reported",  // 10
  "Quarantined",        // 11
  "Released",           // 12
  "Consumed",           // 13
  "Destroyed",          // 14
  "Admin Reassigned"    // 15
];

export const STATUS_CONFIG = {
  0: { label: "None", color: "bg-[#EAE1CB] text-[#596579] border border-[#D5C7A8]", dot: "bg-[#8B98AA]" },
  1: { label: "Active", color: "bg-[#DCE6F5] text-[#2457A6] border border-[#BDD0EE]", dot: "bg-[#2457A6]" },
  2: { label: "In Transit", color: "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]", dot: "bg-[#D97706]" },
  3: { label: "Quarantined", color: "bg-[#F6D9D4] text-[#C23B30] border border-[#EDB8B3]", dot: "bg-[#C23B30]" },
  4: { label: "Consumed", color: "bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]", dot: "bg-[#7C3AED]" },
  5: { label: "Destroyed", color: "bg-[#EAE1CB] text-[#596579] border border-[#D5C7A8]", dot: "bg-[#596579]" },
};

export const ORG_TYPE_NAMES = [
  "None",
  "Hospital",
  "Laboratory",
  "Research Facility",
  "Logistics Courier",
  "Regulatory Auditor"
];
