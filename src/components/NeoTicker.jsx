import React, { useState, useEffect } from "react";
import { Zap, ShieldCheck, Activity, ThermometerSnowflake, Cpu, Lock, Radio } from "lucide-react";

export default function NeoTicker() {
  const [blockHeight, setBlockHeight] = useState(4912044);

  useEffect(() => {
    const timer = setInterval(() => {
      setBlockHeight((b) => b + 1);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const items = [
    {
      icon: Activity,
      label: "EVM BLOCK",
      val: `#${blockHeight.toLocaleString()} [0.8s]`,
      bg: "bg-[#D7FB38]",
      pulse: true,
    },
    {
      icon: Lock,
      label: "PROOF ANCHOR",
      val: "KECCAK-256 IMMUTABLE",
      bg: "bg-[#FDE047]",
    },
    {
      icon: ThermometerSnowflake,
      label: "COLD-CHAIN",
      val: "-80.4°C [LN2 COMPLIANT]",
      bg: "bg-[#38BDF8]",
      pulse: true,
    },
    {
      icon: ShieldCheck,
      label: "FDA 21 CFR §11",
      val: "AUDIT TRAIL SECURED",
      bg: "bg-[#BBF7D0]",
    },
    {
      icon: Cpu,
      label: "L2 GAS",
      val: "12 GWEI (OPTIMISM)",
      bg: "bg-[#C084FC]",
    },
    {
      icon: Radio,
      label: "CUSTODY HANDOFF",
      val: "TWO-STEP MULTISIG",
      bg: "bg-[#FB923C]",
    },
    {
      icon: Zap,
      label: "TAMPER DETECT",
      val: "ZERO BREACHES DETECTED",
      bg: "bg-[#D7FB38]",
    }
  ];

  return (
    <div className="w-full bg-[#0A0A0A] border-b-2 border-[#0A0A0A] py-1 overflow-hidden select-none">
      <div className="ticker-wrap">
        <div className="ticker-track flex items-center gap-3">
          {[...items, ...items, ...items].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#0A0A0A] text-[10px] font-mono shrink-0 shadow-[1px_1px_0px_#FFFFFF] hover:bg-[#D7FB38] transition-colors cursor-default"
              >
                {item.pulse ? (
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.bg} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${item.bg} border border-[#0A0A0A]`}></span>
                  </span>
                ) : (
                  <span className={`w-2 h-2 rounded-full ${item.bg} border border-[#0A0A0A]`}></span>
                )}
                <span className="text-[#52525B] font-bold">{item.label}:</span>
                <span className="font-extrabold text-[#0A0A0A]">{item.val}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
