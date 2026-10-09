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
  Building,
  RotateCcw,
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

  // State for transfer modal / form
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [recipientAddr, setRecipientAddr] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // Incoming transfers directed to activeAccount
  const incoming = samples.filter(
    (s) => s.status === 2 && s.pendingRecipient?.toLowerCase() === activeAccount.toLowerCase()
  );

  // Outgoing transfers sent by activeAccount
  const outgoing = samples.filter(
    (s) => s.status === 2 && s.custodian?.toLowerCase() === activeAccount.toLowerCase()
  );

  // Eligible samples to send (must be active and held by activeAccount)
  const myHoldings = samples.filter(
    (s) => s.status === 1 && s.custodian?.toLowerCase() === activeAccount.toLowerCase()
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedSampleId || !recipientAddr) {
      setMsg({ text: "Please select a sample and a destination organization.", type: "err" });
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
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 border border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
            Two-Step Custody Handoffs & Chain Transfers
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Physical handoffs require cryptographic confirmation. Deliveries marked damaged or out-of-spec are automatically quarantined.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400">Acting Custodian</span>
          <div className="text-xs font-bold text-cyan-300 font-mono">
            {currentActor.name}
          </div>
        </div>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
            msg.type === "ok"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {msg.type === "ok" ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          )}
          {msg.text}
        </div>
      )}

      {/* Grid: Incoming Transfers Inbox & Send Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Incoming Transfers Waiting for Intake */}
        <div className="glass-panel p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-400" />
                Incoming Transfers Inbox ({incoming.length})
              </h3>
              <span className="text-[11px] text-slate-400">Awaiting Your Intake</span>
            </div>

            <div className="mt-4 space-y-4">
              {incoming.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No shipments currently pending delivery to your organization.
                </div>
              ) : (
                incoming.map((s) => (
                  <div
                    key={s.sampleId}
                    className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          onClick={() => onSelectSample(s.sampleId)}
                          className="font-bold text-sm text-cyan-300 font-mono cursor-pointer hover:underline"
                        >
                          {s.externalId}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">{s.sampleType}</p>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                        IN TRANSIT
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <div>
                        Sender: <span className="text-slate-200">{getOrgName(s.custodian)}</span>
                      </div>
                      <div>
                        Anchor: <span className="font-mono text-cyan-400">{shortHash(s.headHash, 4)}</span>
                      </div>
                    </div>

                    {/* Actions: Accept Intact vs Damaged vs Reject */}
                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleAccept(s.sampleId, true)}
                        className="btn-primary text-[11px] py-1.5 px-3 flex-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accept (Intact)
                      </button>

                      <button
                        onClick={() => handleAccept(s.sampleId, false)}
                        className="btn-danger text-[11px] py-1.5 px-2.5"
                        title="Auto-quarantines the specimen due to compromise"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        Damaged / Excursion
                      </button>

                      <button
                        onClick={() => handleReject(s.sampleId)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                        title="Reject Transfer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Initiate Handoff Transfer Form */}
        <div className="glass-panel p-6 border border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              Initiate Outgoing Custody Dispatch
            </h3>
            <span className="text-[11px] text-slate-400">Handoff to Partner</span>
          </div>

          <form onSubmit={handleSend} className="mt-4 space-y-4">
            
            <div>
              <label>Select Specimen in Your Custody</label>
              {myHoldings.length === 0 ? (
                <div className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  You currently have no active specimens in your custody to transfer.
                </div>
              ) : (
                <select
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                  className="text-sm"
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
              <label>Designated Recipient Organization</label>
              <select
                value={recipientAddr}
                onChange={(e) => setRecipientAddr(e.target.value)}
                className="text-sm"
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
              <label>Shipping AirWayBill / Transport Manifest</label>
              <input
                type="text"
                placeholder="e.g. Dry ice courier container #CRYO-9921, AWB #88123"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || myHoldings.length === 0}
              className="btn-primary w-full text-xs py-2.5 mt-2"
            >
              {loading ? "Recording Handoff on Chain..." : "Sign & Dispatch Transfer"}
            </button>

          </form>
        </div>

      </div>

      {/* Outgoing Shipments in Flight */}
      {outgoing.length > 0 && (
        <div className="glass-panel p-6 border border-white/10">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-cyan-400" />
            Your Outgoing Shipments Currently in Transit ({outgoing.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outgoing.map((s) => (
              <div
                key={s.sampleId}
                className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span
                    onClick={() => onSelectSample(s.sampleId)}
                    className="font-bold text-xs text-white font-mono hover:text-cyan-300 cursor-pointer"
                  >
                    {s.externalId}
                  </span>
                  <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                    Waiting for intake
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Destination: <span className="text-slate-200">{getOrgName(s.pendingRecipient)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
