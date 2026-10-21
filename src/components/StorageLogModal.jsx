import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { X, Thermometer } from "lucide-react";

export default function StorageLogModal({ sample, onClose, onSuccess }) {
  const { logStorage } = useChain();

  const [location, setLocation] = useState("Freezer Unit #UL-80, Rack 3, Shelf B");
  const [tempCelsius, setTempCelsius] = useState("-80.0");
  const [note, setNote] = useState("Routine monitoring. Seal and cryo-box intact.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!sample) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location.trim()) {
      setError("Storage location is required.");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const tempVal = tempCelsius.trim() !== "" ? Math.round(parseFloat(tempCelsius) * 10) : -2147483648;

      await logStorage(sample.sampleId, location.trim(), tempVal, note.trim());
      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to log storage");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFFFFF] border-[2.5px] border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] rounded-2xl max-w-md w-full overflow-hidden text-[#0A0A0A]">
        
        <div className="p-4 sm:p-5 border-b-2 border-[#0A0A0A] bg-[#FFFFFF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#38BDF8] text-[#0A0A0A] flex items-center justify-center border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0A0A0A] tracking-tight">Log Storage & Temperature</h3>
              <p className="text-[11px] text-[#52525B] font-mono font-bold">{sample.externalId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FFE4E6] border-2 border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FFF1F2] border-2 border-[#FF5A5F] text-[#BE123C] text-xs font-bold shadow-[2px_2px_0px_#FF5A5F]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">Physical Storage Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. CryoFreezer A-2, Tray 4"
              required
              className="brutal-input w-full text-xs sm:text-sm p-2.5 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">Storage Temperature (°C)</label>
            <div className="space-y-2.5">
              <input
                type="number"
                step="0.1"
                value={tempCelsius}
                onChange={(e) => setTempCelsius(e.target.value)}
                placeholder="-80.0"
                className="brutal-input w-full text-xs sm:text-sm p-2.5 font-mono font-bold"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTempCelsius("-80.0")}
                  className="flex-1 py-1.5 text-xs bg-[#FFFFFF] hover:bg-[#D7FB38] border-2 border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] rounded-lg text-[#0A0A0A] font-mono font-bold transition-all cursor-pointer"
                >
                  -80°C
                </button>
                <button
                  type="button"
                  onClick={() => setTempCelsius("-20.0")}
                  className="flex-1 py-1.5 text-xs bg-[#FFFFFF] hover:bg-[#38BDF8] border-2 border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] rounded-lg text-[#0A0A0A] font-mono font-bold transition-all cursor-pointer"
                >
                  -20°C
                </button>
                <button
                  type="button"
                  onClick={() => setTempCelsius("4.0")}
                  className="flex-1 py-1.5 text-xs bg-[#FFFFFF] hover:bg-[#FDE047] border-2 border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] rounded-lg text-[#0A0A0A] font-mono font-bold transition-all cursor-pointer"
                >
                  +4°C
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">Inspection Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Verified data logger telemetry"
              className="brutal-input w-full text-xs sm:text-sm p-2.5 font-mono"
            />
          </div>

          <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2.5 border-t-2 border-[#0A0A0A]">
            <button type="button" onClick={onClose} className="brutal-btn brutal-btn-secondary text-xs py-2.5 px-4 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="brutal-btn brutal-btn-cyan text-xs py-2.5 px-5 uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
              {loading ? "Recording..." : "Record on Chain"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
