import React from "react";
import { Zap, ShieldCheck, Activity, ThermometerSnowflake, Cpu, CheckCircle2, Lock, Radio } from "lucide-react";

export default function NeoTicker() {
  const items = [
    {
      icon: Activity,
      label: "EVM BLOCK",
      val: "#4,912,044 [0.8s]",
      bg: "bg-[#B4F000]",
      text: "text-[#162013]"
    },
    {
      icon: Lock,
      label: "PROOF ANCHOR",
      val: "SHA256 IMMUTABLE",
      bg: "bg-[#FFE600]",
      text: "text-[#162013]"
    },
    {
      icon: ThermometerSnowflake,
      label: "CRYOGENIC STATUS",
      val: "-80.4°C [LN2 COMPLIANT]",
      bg: "bg-[#22D3EE]",
      text: "text-[#162013]"
    },
    {
      icon: ShieldCheck,
      label: "FDA 21 CFR §11",
      val: "AUDIT TRAIL SECURED",
      bg: "bg-[#FF70A6]",
      text: "text-[#FFFFFF]"
    },
    {
      icon: Cpu,
      label: "GAS TRACKER",
      val: "12 GWEI (OPTIMISM L2)",
      bg: "bg-[#C084FC]",
      text: "text-[#162013]"
    },
    {
      icon: Radio,
      label: "CUSTODY HANDOFF",
      val: "TWO-STEP MULTISIG",
      bg: "bg-[#FF6B4A]",
      text: "text-[#FFFFFF]"
    },
    {
      icon: Zap,
      label: "TAMPER DETECT",
      val: "ZERO BREACHES DETECTED",
      bg: "bg-[#8FB339]",
      text: "text-[#FFFFFF]"
    }
  ];

  return (
    <div className="w-full bg-[#162013] border-b-[2.5px] border-[#162013] py-1.5 overflow-hidden shadow-[0_3px_0px_#162013] select-none">
      <div className="neo-ticker-wrap">
        <div className="neo-ticker-track flex items-center gap-3">
          {[...items, ...items, ...items].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border-[1.5px] border-[#162013] text-[10px] font-black uppercase font-mono shadow-[2px_2px_0px_#000000] shrink-0 ${item.bg} ${item.text}`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="opacity-80 font-bold">{item.label}:</span>
                <span className="font-extrabold">{item.val}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
