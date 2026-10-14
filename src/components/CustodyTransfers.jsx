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
    <div className="space-y-6 sm:space-y-7 animate-fadeIn">
      
      {/* Header Banner - Multi-Color Neo-Brutalist Panel */}
      <div className="bg-[#FFFFFF] p-5 sm:p-6 border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Top color strip */}
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          <div className="w-1/3 bg-[#FFE600]"></div>
          <div className="w-1/3 bg-[#B4F000]"></div>
          <div className="w-1/3 bg-[#FF70A6]"></div>
        </div>

        <div className="mt-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded bg-[#FFE600] text-[#162013] border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] -rotate-1">
              CHAIN OF CUSTODY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#162013] flex items-center gap-2.5 font-display">
            <ArrowLeftRight className="w-5 h-5 text-[#435E2F] shrink-0" />
            <span>Two-Step Custody Handoffs & Chain Transfers</span>
          </h2>
          <p className="text-xs text-[#33442E] mt-1 font-bold">
            Physical handoffs require cryptographic receipt. Out-of-spec or damaged arrivals automatically trigger quarantine.
          </p>
        </div>

        <div className="sm:text-right pt-3 sm:pt-0 border-t-2 sm:border-t-0 border-[#162013] flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
          <span className="text-[10px] text-[#5D7057] font-black uppercase tracking-wider font-mono">Current Acting Custodian:</span>
          <div className="text-xs font-black text-[#162013] font-mono bg-[#B4F000] px-3 py-1 rounded-xl border-2 border-[#162013] mt-1 shadow-[2px_2px_0px_#162013]">
            {currentActor.name}
          </div>
        </div>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-xl border-[2.5px] border-[#162013] text-xs font-black flex items-center gap-2.5 shadow-[3px_3px_0px_#162013] animate-fadeIn ${
            msg.type === "ok"
              ? "bg-[#EEFDC8] text-[#162013]"
              : "bg-[#FFE4E6] text-[#DC2626]"
          }`}
        >
          {msg.type === "ok" ? (
            <ShieldCheck className="w-4 h-4 text-[#435E2F] shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Grid: Incoming Transfers Inbox & Send Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Incoming Transfers Waiting for Intake */}
        <div className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] flex flex-col justify-between overflow-hidden">
          <div className="bg-[#FFE600] px-5 py-3 border-b-2 border-[#162013] flex items-center justify-between">
            <h3 className="text-sm font-black text-[#162013] flex items-center gap-2 uppercase font-display tracking-tight">
              <Inbox className="w-4 h-4 text-[#162013]" />
              Incoming Transfers Inbox ({incoming.length})
            </h3>
            <span className="text-[10px] text-[#162013] font-mono font-black bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border-2 border-[#162013] shadow-[1px_1px_0px_#162013]">
              Awaiting Intake
            </span>
          </div>

          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {incoming.length === 0 ? (
                <div className="py-12 text-center text-[#5D7057] text-xs font-mono font-bold">
                  No shipments currently pending delivery to your organization.
                </div>
              ) : (
                incoming.map((s) => (
                  <div
                    key={s.sampleId}
                    className="p-4 rounded-xl bg-[#F4F7F1] border-2 border-[#162013] shadow-[2.5px_2.5px_0px_#162013] space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          onClick={() => onSelectSample(s.sampleId)}
                          className="font-black text-sm text-[#162013] hover:text-[#435E2F] font-mono cursor-pointer hover:underline"
                        >
                          {s.externalId}
                        </span>
                        <p className="text-xs text-[#5D7057] mt-0.5 font-bold uppercase">{s.sampleType}</p>
                      </div>
                      <span className="text-[10px] bg-[#FFE600] text-[#162013] border-2 border-[#162013] px-2.5 py-0.5 rounded-full font-mono font-black shadow-[1px_1px_0px_#162013]">
                        IN TRANSIT
                      </span>
                    </div>

                    <div className="text-xs text-[#33442E] space-y-1 font-bold">
                      <div>
                        Sender: <span className="text-[#162013] font-black">{getOrgName(s.custodian)}</span>
                      </div>
                      <div>
                        Anchor: <span className="font-mono text-[#162013] font-black bg-[#EAF2E5] px-2 py-0.5 rounded border border-[#162013]">{shortHash(s.headHash, 4)}</span>
                      </div>
                    </div>

                    {/* Actions: Accept Intact vs Damaged vs Reject */}
                    <div className="pt-3 border-t-2 border-[#162013] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        onClick={() => handleAccept(s.sampleId, true)}
                        className="btn-lime text-xs py-2 px-3 flex-1 justify-center uppercase font-black"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept (Intact)</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(s.sampleId, false)}
                          className="btn-pink text-xs py-2 px-3 flex-1 justify-center uppercase font-black"
                          title="Auto-quarantines the specimen due to compromise"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>Damaged / Compromised</span>
                        </button>

                        <button
                          onClick={() => handleReject(s.sampleId)}
                          className="p-2.5 rounded-xl bg-[#FFFFFF] text-[#DC2626] hover:bg-[#FFE4E6] border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center min-w-[42px]"
                          title="Reject Transfer"
                        >
                          <XCircle className="w-4 h-4" />
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
        <div className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] overflow-hidden">
          <div className="bg-[#22D3EE] px-5 py-3 border-b-2 border-[#162013] flex items-center justify-between">
            <h3 className="text-sm font-black text-[#162013] flex items-center gap-2 uppercase font-display tracking-tight">
              <Send className="w-4 h-4 text-[#162013]" />
              Initiate Custody Dispatch
            </h3>
            <span className="text-[10px] text-[#162013] font-mono font-black bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border-2 border-[#162013] shadow-[1px_1px_0px_#162013]">
              Handoff Sign
            </span>
          </div>

          <form onSubmit={handleSend} className="p-5 sm:p-6 space-y-4">
            
            <div>
              <label>Select Specimen in Your Custody</label>
              {myHoldings.length === 0 ? (
                <div className="text-xs text-[#713F12] bg-[#FEF9C3] p-3 rounded-xl border-2 border-[#162013] font-bold shadow-[2px_2px_0px_#162013]">
                  You currently have no active specimens in your custody to transfer.
                </div>
              ) : (
                <select
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                  className="text-sm font-bold bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013]"
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
                className="text-sm font-bold bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013]"
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
              <label>Shipping Manifest / Tracking Details</label>
              <input
                type="text"
                placeholder="e.g. Dry ice shipper container #CRYO-9921, AWB #88123"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013] font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading || myHoldings.length === 0}
              className="btn-yellow w-full text-xs py-3 mt-2 uppercase font-black"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>{loading ? "Recording Handoff on Chain..." : "Sign & Dispatch Transfer"}</span>
            </button>

          </form>
        </div>

      </div>

      {/* Outgoing Shipments in Flight */}
      {outgoing.length > 0 && (
        <div className="bg-[#FFFFFF] p-5 sm:p-6 border-[2.5px] border-[#162013] rounded-2xl shadow-[4px_4px_0px_#162013]">
          <h3 className="text-sm font-extrabold text-[#162013] flex items-center gap-2 mb-4 uppercase font-display tracking-tight">
            <Truck className="w-4 h-4 text-[#435E2F]" />
            Your Outgoing Shipments Currently in Transit ({outgoing.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outgoing.map((s) => (
              <div
                key={s.sampleId}
                className="p-4 rounded-xl bg-[#F4F7F1] border-2 border-[#162013] shadow-[2px_2px_0px_#162013] space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span
                    onClick={() => onSelectSample(s.sampleId)}
                    className="font-extrabold text-xs text-[#162013] hover:text-[#435E2F] font-mono hover:underline cursor-pointer"
                  >
                    {s.externalId}
                  </span>
                  <span className="text-[10px] text-[#713F12] bg-[#FEF9C3] px-2 py-0.5 rounded-full font-extrabold border border-[#162013]">
                    Waiting for intake
                  </span>
                </div>
                <div className="text-xs text-[#33442E] font-medium">
                  Destination: <span className="text-[#162013] font-bold">{getOrgName(s.pendingRecipient)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
