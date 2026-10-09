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
  // Detect if seconds or milliseconds
  const ms = num < 10000000000 ? num * 1000 : num;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
  0: { label: "None", color: "bg-slate-700 text-slate-300", dot: "bg-slate-400" },
  1: { label: "Active", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-500" },
  2: { label: "In Transit", color: "bg-amber-500/10 text-amber-400 border border-amber-500/30", dot: "bg-amber-500" },
  3: { label: "Quarantined", color: "bg-rose-500/10 text-rose-400 border border-rose-500/30", dot: "bg-rose-500" },
  4: { label: "Consumed", color: "bg-purple-500/10 text-purple-400 border border-purple-500/30", dot: "bg-purple-500" },
  5: { label: "Destroyed", color: "bg-slate-600/30 text-slate-400 border border-slate-600/40", dot: "bg-slate-500" },
};

export const ORG_TYPE_NAMES = [
  "None",
  "Hospital",
  "Laboratory",
  "Research Facility",
  "Logistics Courier",
  "Regulatory Auditor"
];
