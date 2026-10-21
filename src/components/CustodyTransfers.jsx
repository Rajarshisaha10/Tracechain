import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { formatTimestamp, shortHash, STATUS_CONFIG } from "../utils/formatters";
import {
  ArrowLeftRight,
  Inbox,
  Send,
  CheckCircle2,
  AlertOctagon,
  XCircle,
  Truck,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";

export default function CustodyTransfers({ onSelectSample }) {
  const {
    sandboxData,
    activeAccount,
    initiateTransfer,
    acceptTransfer,
    rejectTransfer,
    currentActor
  } = useChain();

  const samples = Object.values(sandboxData.samples || {});
  const orgs = Object.values(sandboxData.orgs || {});

  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [recipientAddr, setRecipientAddr] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const incoming = samples.filter(
    (s) => s.status === 2 && s.pendingRecipient?.toLowerCase() === activeAccount.toLowerCase()
  );

  const outgoing = samples.filter(
    (s) => s.status === 2 && s.custodian?.toLowerCase() === activeAccount.toLowerCase()
  );

  const myHoldings = samples.filter(
    (s) => s.status === 1 && s.custodian?.toLowerCase() === activeAccount.toLowerCase()
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedSampleId || !recipientAddr) {
      setMsg({ text: "Please select a specimen and a destination organization.", type: "err" });
      return;
    }
    try {
      setLoading(true);
      setMsg({ text: "", type: "" });
      await initiateTransfer(
        selectedSampleId,
        recipientAddr,
        transferNote || "Custody handoff dispatched"
      );
      setMsg({ text: "Transfer handoff successfully initiated on-chain!", type: "ok" });
      setSelectedSampleId("");
      setRecipientAddr("");
      setTransferNote("");
      setLoading(false);
    } catch (err) {
      setMsg({ text: err.message || "Failed to initiate transfer", type: "err" });
      setLoading(false);
    }
  };

  const handleAccept = async (sampleId, intact) => {
    try {
      const note = intact
        ? "Received in verified intact condition"
        : "Received in damaged/compromised condition (vial cracked / temp breached)";
      await acceptTransfer(sampleId, intact, note);
      setMsg({
        text: intact
          ? "Custody accepted! Specimen is now Active in your custody."
          : "Delivery marked DAMAGED. Specimen automatically quarantined on-chain for safety!",
        type: intact ? "ok" : "err"
      });
    } catch (err) {
      setMsg({ text: err.message, type: "err" });
    }
  };

  const handleReject = async (sampleId) => {
    try {
      await rejectTransfer(sampleId, "Recipient rejected delivery at intake inspection");
      setMsg({ text: "Transfer rejected. Custody returned to sender.", type: "ok" });
    } catch (err) {
      setMsg({ text: err.message, type: "err" });
    }
  };

  const getOrgName = (addr) => {
    return sandboxData.orgs[addr]?.name || shortHash(addr, 4);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="brutal-pill bg-[#38BDF8] text-[10px]">
              CHAIN OF CUSTODY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0A0A0A] flex items-center gap-2 font-display">
            <ArrowLeftRight className="w-5 h-5 text-[#0A0A0A] shrink-0" />
            <span>Two-Step Custody Handoffs & Transfers</span>
          </h2>
          <p className="text-xs text-[#52525B] mt-0.5 font-medium">
            Physical handoffs require cryptographic confirmation. Compromised arrivals automatically trigger on-chain quarantine.
          </p>
        </div>

        <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#0A0A0A]/20 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
          <span className="text-[10px] text-[#52525B] uppercase font-mono font-bold">Active Custodian:</span>
          <div className="text-xs font-black text-[#0A0A0A] font-mono bg-[#D7FB38] border border-[#0A0A0A] px-2.5 py-0.5 rounded-lg mt-0.5 shadow-[1px_1px_0px_#0A0A0A]">
            {currentActor.name}
          </div>
        </div>
      </div>

      {msg.text && (
        <div
          className={`p-3 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#0A0A0A] animate-fadeIn ${
            msg.type === "ok"
              ? "bg-[#D7FB38] text-[#0A0A0A]"
              : "bg-[#FF5A5F] text-white"
          }`}
        >
          {msg.type === "ok" ? (
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#0A0A0A]" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0 text-white" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Animated Custody Pipeline Visualizer */}
      <div className="brutal-card p-4 bg-[#FFFFFF] overflow-hidden">
        <div className="flex items-center justify-between mb-3 border-b-2 border-[#0A0A0A] pb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#38BDF8] border border-[#0A0A0A]"></span>
            </span>
            <span className="text-xs font-black uppercase font-mono tracking-wider text-[#0A0A0A]">
              Cryptographic Custody Protocol Pipeline
            </span>
          </div>
          <span className="brutal-pill bg-[#D7FB38] text-[9px]">EVM Multisig</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 relative">
          {/* Stage 1 */}
          <div className="p-3 rounded-xl bg-[#F7F8F4] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] relative hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold bg-[#D7FB38] border border-[#0A0A0A] px-1.5 py-0.2 rounded">01 // ROOT</span>
              <span className="w-2 h-2 rounded-full bg-[#10B981] border border-[#0A0A0A]"></span>
            </div>
            <div className="font-extrabold text-xs text-[#0A0A0A] mt-1.5">Extraction Ward</div>
            <div className="text-[10px] text-[#52525B] font-mono">Consent Seal & Barcode</div>
          </div>

          {/* Stage 2 */}
          <div className="p-3 rounded-xl bg-[#F7F8F4] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] relative hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold bg-[#38BDF8] border border-[#0A0A0A] px-1.5 py-0.2 rounded">02 // IN-TRANSIT</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0284C7] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0284C7] border border-[#0A0A0A]"></span>
              </span>
            </div>
            <div className="font-extrabold text-xs text-[#0A0A0A] mt-1.5">Cryo Courier</div>
            <div className="text-[10px] text-[#52525B] font-mono">-80°C LN2 Logger Active</div>
          </div>

          {/* Stage 3 */}
          <div className="p-3 rounded-xl bg-[#F7F8F4] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] relative hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold bg-[#FDE047] border border-[#0A0A0A] px-1.5 py-0.2 rounded">03 // INTAKE</span>
              <span className="w-2 h-2 rounded-full bg-[#EAB308] border border-[#0A0A0A]"></span>
            </div>
            <div className="font-extrabold text-xs text-[#0A0A0A] mt-1.5">Central Biobank</div>
            <div className="text-[10px] text-[#52525B] font-mono">Accept / Auto-Quarantine</div>
          </div>

          {/* Stage 4 */}
          <div className="p-3 rounded-xl bg-[#F7F8F4] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] relative hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold bg-[#C084FC] border border-[#0A0A0A] px-1.5 py-0.2 rounded">04 // ANALYTICS</span>
              <span className="w-2 h-2 rounded-full bg-[#A855F7] border border-[#0A0A0A]"></span>
            </div>
            <div className="font-extrabold text-xs text-[#0A0A0A] mt-1.5">Sequencing Lab</div>
            <div className="text-[10px] text-[#52525B] font-mono">Aliquot Split & Test Proof</div>
          </div>
        </div>
      </div>

      {/* Grid: Incoming Transfers Inbox & Send Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Left: Incoming Transfers Waiting for Intake */}
        <div className="brutal-card bg-[#FFFFFF] flex flex-col justify-between overflow-hidden">
          <div className="bg-[#F7F8F4] px-4 py-2.5 border-b-2 border-[#0A0A0A] flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] flex items-center gap-1.5 font-display uppercase tracking-tight">
              <Inbox className="w-4 h-4 text-[#0A0A0A]" />
              <span>Incoming Transfers Inbox ({incoming.length})</span>
            </h3>
            <span className="brutal-pill bg-[#38BDF8] text-[9px]">
              Awaiting Intake
            </span>
          </div>

          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {incoming.length === 0 ? (
                <div className="py-10 text-center text-[#71717A] text-xs font-mono">
                  No shipments currently pending delivery to your organization.
                </div>
              ) : (
                incoming.map((s) => (
                  <div
                    key={s.sampleId}
                    className="p-3.5 rounded-xl bg-[#F7F8F4] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          onClick={() => onSelectSample(s.sampleId)}
                          className="font-black text-sm text-[#0A0A0A] hover:underline font-mono cursor-pointer"
                        >
                          {s.externalId}
                        </span>
                        <p className="text-xs text-[#52525B] font-bold mt-0.5">{s.sampleType}</p>
                      </div>
                      <span className="brutal-pill bg-[#38BDF8] text-[9px]">
                        IN TRANSIT
                      </span>
                    </div>

                    <div className="text-xs text-[#0A0A0A] space-y-0.5 font-medium">
                      <div>
                        Sender: <strong className="font-bold">{getOrgName(s.custodian)}</strong>
                      </div>
                      <div>
                        Anchor: <span className="font-mono bg-[#FFFFFF] px-1.5 py-0.2 rounded border border-[#0A0A0A] font-bold text-[10px]">{shortHash(s.headHash, 4)}</span>
                      </div>
                    </div>

                    {/* Actions: Accept Intact vs Damaged vs Reject */}
                    <div className="pt-2 border-t border-[#0A0A0A]/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                      <button
                        onClick={() => handleAccept(s.sampleId, true)}
                        className="brutal-btn brutal-btn-primary text-xs py-1.5 px-3 flex-1 justify-center"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept (Intact)</span>
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleAccept(s.sampleId, false)}
                          className="brutal-btn brutal-btn-danger text-xs py-1.5 px-2.5 flex-1 justify-center"
                          title="Auto-quarantines the specimen due to compromise"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>Damaged</span>
                        </button>

                        <button
                          onClick={() => handleReject(s.sampleId)}
                          className="p-2 rounded-lg bg-[#FFFFFF] hover:bg-[#FFE4E6] text-[#DC2626] border-2 border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center justify-center min-w-[36px]"
                          title="Reject Transfer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Initiate Handoff Transfer Form */}
        <div className="brutal-card bg-[#FFFFFF] overflow-hidden">
          <div className="bg-[#F7F8F4] px-4 py-2.5 border-b-2 border-[#0A0A0A] flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] flex items-center gap-1.5 font-display uppercase tracking-tight">
              <Send className="w-4 h-4 text-[#0A0A0A]" />
              <span>Initiate Custody Dispatch</span>
            </h3>
            <span className="brutal-pill bg-[#D7FB38] text-[9px]">
              Handoff Sign
            </span>
          </div>

          <form onSubmit={handleSend} className="p-4 sm:p-5 space-y-3">
            
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Select Specimen</label>
              {myHoldings.length === 0 ? (
                <div className="text-xs text-[#854D0E] bg-[#FEF9C3] p-2.5 rounded-lg border border-[#0A0A0A] font-semibold">
                  You currently have no active specimens in your custody to transfer.
                </div>
              ) : (
                <select
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                  className="w-full text-xs sm:text-sm brutal-input p-2 font-mono font-bold"
                  required
                >
                  <option value="">-- Choose specimen --</option>
                  {myHoldings.map((s) => (
                    <option key={s.sampleId} value={s.sampleId}>
                      {s.externalId} ({s.sampleType})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Recipient Organization</label>
              <select
                value={recipientAddr}
                onChange={(e) => setRecipientAddr(e.target.value)}
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono font-bold"
                required
              >
                <option value="">-- Choose recipient partner --</option>
                {orgs
                  .filter((o) => o.address.toLowerCase() !== activeAccount.toLowerCase() && o.orgType !== 5)
                  .map((o) => (
                    <option key={o.address} value={o.address}>
                      {o.name} ({o.orgTypeName})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Shipping Manifest / Tracking Details</label>
              <input
                type="text"
                placeholder="e.g. Dry ice shipper container #CRYO-9921, AWB #88123"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || myHoldings.length === 0}
              className="brutal-btn brutal-btn-primary w-full text-xs py-2.5 uppercase font-bold mt-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Recording Handoff on Chain..." : "Sign & Dispatch Transfer"}</span>
            </button>

          </form>
        </div>

      </div>

      {/* Outgoing Shipments in Flight */}
      {outgoing.length > 0 && (
        <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF]">
          <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] flex items-center gap-2 mb-3 uppercase font-display">
            <Truck className="w-4 h-4 text-[#0A0A0A]" />
            <span>Your Outgoing Shipments in Transit ({outgoing.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {outgoing.map((s) => (
              <div
                key={s.sampleId}
                className="p-3 rounded-lg bg-[#F7F8F4] border border-[#0A0A0A] space-y-1"
              >
                <div className="flex justify-between items-start">
                  <span
                    onClick={() => onSelectSample(s.sampleId)}
                    className="font-black text-xs text-[#0A0A0A] hover:underline font-mono cursor-pointer"
                  >
                    {s.externalId}
                  </span>
                  <span className="brutal-pill bg-[#38BDF8] text-[9px]">
                    In Transit
                  </span>
                </div>
                <div className="text-xs text-[#52525B]">
                  Destination: <strong className="text-[#0A0A0A]">{getOrgName(s.pendingRecipient)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
