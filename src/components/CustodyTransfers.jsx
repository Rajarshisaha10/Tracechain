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
      <div className="glass-panel p-4 sm:p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1B2B45] flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-[#2457A6] shrink-0" />
            <span>Two-Step Custody Handoffs & Chain Transfers</span>
          </h2>
          <p className="text-xs text-[#596579] mt-1 font-medium">
            Physical handoffs require cryptographic confirmation. Deliveries marked damaged or out-of-spec are automatically quarantined.
          </p>
        </div>

        <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E3D7BC] flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
          <span className="text-[11px] text-[#6B7287]">Acting Custodian:</span>
          <div className="text-xs font-extrabold text-[#2457A6] font-mono">
            {currentActor.name}
          </div>
        </div>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-2xl border-2 text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            msg.type === "ok"
              ? "bg-[#DCE6F5] border-[#BDD0EE] text-[#1B4385]"
              : "bg-[#F6D9D4] border-[#EDB8B3] text-[#9E2A20]"
          }`}
        >
          {msg.type === "ok" ? (
            <ShieldCheck className="w-4 h-4 text-[#2457A6]" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-[#C23B30]" />
          )}
          {msg.text}
        </div>
      )}

      {/* Grid: Incoming Transfers Inbox & Send Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Incoming Transfers Waiting for Intake */}
        <div className="glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#E3D7BC]">
              <h3 className="text-sm font-extrabold text-[#1B2B45] flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#D97706]" />
                Incoming Transfers Inbox ({incoming.length})
              </h3>
              <span className="text-[11px] text-[#6B7287] font-semibold">Awaiting Your Intake</span>
            </div>

            <div className="mt-4 space-y-4">
              {incoming.length === 0 ? (
                <div className="py-12 text-center text-[#6B7287] text-xs font-medium">
                  No shipments currently pending delivery to your organization.
                </div>
              ) : (
                incoming.map((s) => (
                  <div
                    key={s.sampleId}
                    className="p-4.5 rounded-2xl bg-[#F5EEDC] border-2 border-[#E3D7BC] space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          onClick={() => onSelectSample(s.sampleId)}
                          className="font-extrabold text-sm text-[#2457A6] font-mono cursor-pointer hover:underline"
                        >
                          {s.externalId}
                        </span>
                        <p className="text-xs text-[#596579] mt-0.5 font-medium">{s.sampleType}</p>
                      </div>
                      <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2 py-0.5 rounded-full font-mono font-bold">
                        IN TRANSIT
                      </span>
                    </div>

                    <div className="text-xs text-[#596579] space-y-1">
                      <div>
                        Sender: <span className="text-[#1B2B45] font-bold">{getOrgName(s.custodian)}</span>
                      </div>
                      <div>
                        Anchor: <span className="font-mono text-[#2457A6] font-bold">{shortHash(s.headHash, 4)}</span>
                      </div>
                    </div>

                    {/* Actions: Accept Intact vs Damaged vs Reject */}
                    <div className="pt-2.5 border-t border-[#E3D7BC] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        onClick={() => handleAccept(s.sampleId, true)}
                        className="btn-primary text-xs py-2 px-3 flex-1 justify-center"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept (Intact)</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(s.sampleId, false)}
                          className="btn-danger text-xs py-2 px-3 flex-1 justify-center"
                          title="Auto-quarantines the specimen due to compromise"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>Damaged / Excursion</span>
                        </button>

                        <button
                          onClick={() => handleReject(s.sampleId)}
                          className="p-2.5 rounded-xl bg-[#EBDDB8] text-[#1B2B45] hover:bg-[#D2C4A3] transition-colors flex items-center justify-center min-w-[42px]"
                          title="Reject Transfer"
                        >
                          <XCircle className="w-4 h-4 text-[#C23B30]" />
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
        <div className="glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E3D7BC]">
            <h3 className="text-sm font-extrabold text-[#1B2B45] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#2457A6]" />
              Initiate Custody Dispatch
            </h3>
            <span className="text-[11px] text-[#6B7287] font-semibold">Handoff to Partner</span>
          </div>

          <form onSubmit={handleSend} className="mt-4 space-y-4">
            
            <div>
              <label>Select Specimen in Your Custody</label>
              {myHoldings.length === 0 ? (
                <div className="text-xs text-[#92400E] bg-[#FEF3C7] p-3 rounded-xl border border-[#FDE68A] font-bold">
                  You currently have no active specimens in your custody to transfer.
                </div>
              ) : (
                <select
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                  className="text-sm font-bold"
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
                className="text-sm font-bold"
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
        <div className="glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
          <h3 className="text-sm font-extrabold text-[#1B2B45] flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-[#2457A6]" />
            Your Outgoing Shipments Currently in Transit ({outgoing.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outgoing.map((s) => (
              <div
                key={s.sampleId}
                className="p-4 rounded-xl bg-[#F5EEDC] border-2 border-[#E3D7BC] space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span
                    onClick={() => onSelectSample(s.sampleId)}
                    className="font-extrabold text-xs text-[#2457A6] font-mono hover:underline cursor-pointer"
                  >
                    {s.externalId}
                  </span>
                  <span className="text-[10px] text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full font-bold">
                    Waiting for intake
                  </span>
                </div>
                <div className="text-xs text-[#596579]">
                  Destination: <span className="text-[#1B2B45] font-bold">{getOrgName(s.pendingRecipient)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
