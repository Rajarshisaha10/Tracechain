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
  "Collected",           // 0
  "Aliquot Created",     // 1
  "Derived From",        // 2
  "Transfer Initiated",  // 3
  "Transfer Accepted",   // 4
  "Transfer Rejected",   // 5
  "Transfer Cancelled",  // 6
  "Storage Logged",      // 7
  "Handling Action",     // 8
  "Lab Test Recorded",   // 9
  "Incident Reported",   // 10
  "Quarantined",         // 11
  "Released",            // 12
  "Consumed",            // 13
  "Destroyed",           // 14
  "Admin Reassigned",    // 15
  "Report Attested",     // 16
  "Retest Requested",    // 17
  "Retest Reported",     // 18
  "Discrepancy Flagged", // 19
  "Discrepancy Resolved" // 20
];

export const STATUS_CONFIG = {
  0: { label: "None", color: "bg-[#F1F5F9] text-[#334155] border-2 border-[#162013] shadow-[2px_2px_0px_#162013]", dot: "bg-[#64748B]" },
  1: { label: "Active", color: "bg-[#EAF2E5] text-[#263E19] border-2 border-[#162013] shadow-[2px_2px_0px_#162013]", dot: "bg-[#4E6F34]" },
  2: { label: "In Transit", color: "bg-[#FEF9C3] text-[#713F12] border-2 border-[#162013] shadow-[2px_2px_0px_#162013]", dot: "bg-[#CA8A04]" },
  3: { label: "Quarantined", color: "bg-[#FFE4E6] text-[#9F1239] border-2 border-[#162013] shadow-[2px_2px_0px_#162013]", dot: "bg-[#E11D48]" },
  4: { label: "Consumed", color: "bg-[#EDE9FE] text-[#4C1D95] border-2 border-[#162013] shadow-[2px_2px_0px_#162013]", dot: "bg-[#7C3AED]" },
  5: { label: "Destroyed", color: "bg-[#F1F5F9] text-[#0F172A] border-2 border-[#162013] shadow-[2px_2px_0px_#162013]", dot: "bg-[#334155]" },
};

export const ORG_TYPE_NAMES = [
  "None",
  "Hospital",
  "Laboratory",
  "Research Facility",
  "Logistics Courier",
  "Regulatory Auditor"
];

export const DISCREPANCY_STATUS_CONFIG = {
  0: { label: "Open", color: "bg-[#FEF3C7] text-[#92400E] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]", badge: "OPEN DISCREPANCY" },
  1: { label: "Under Review", color: "bg-[#E0F2FE] text-[#0369A1] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]", badge: "UNDER AUDIT REVIEW" },
  2: { label: "Resolved", color: "bg-[#D7FB38] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]", badge: "RESOLVED & ARCHIVED" },
  3: { label: "Escalated", color: "bg-[#FFE4E6] text-[#BE123C] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]", badge: "ESCALATED TO REGULATOR" },
};

export const DISPOSITION_CONFIG = {
  0: { label: "Pending", description: "Investigation underway" },
  1: { label: "Affirmed Original", description: "Original laboratory measurement sustained; retest artifact or protocol deviation identified." },
  2: { label: "Affirmed Retest", description: "Secondary independent retest validated; original report superseded due to measurement error or low sensitivity." },
  3: { label: "Inconclusive (Re-collect)", description: "Both results divergent due to specimen degradation; fresh clinical specimen collection mandated." },
  4: { label: "Contaminated (Discard)", description: "Contamination confirmed across analytical replicates; specimen discarded under biohazard protocols." }
};
