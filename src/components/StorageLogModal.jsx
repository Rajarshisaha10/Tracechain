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
    <div className="modal-overlay">
      <div className="modal-content max-w-md bg-[#FFFFFF] border-[3px] border-[#162013] shadow-[8px_8px_0px_#162013] rounded-2xl">
        
        <div className="p-5 border-b-[2.5px] border-[#162013] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF2E5] text-[#435E2F] flex items-center justify-center border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013]">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#162013] uppercase font-display tracking-tight">Log Storage & Temperature</h3>
              <p className="text-[11px] text-[#5D7057] font-mono font-bold">{sample.externalId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#FFFFFF] text-[#162013] hover:bg-[#FFE4E6] border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FFE4E6] border-2 border-[#162013] text-[#DC2626] text-xs font-extrabold shadow-[2px_2px_0px_#162013]">
              {error}
            </div>
          )}

          <div>
            <label>Physical Storage Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. CryoFreezer A-2, Tray 4"
              required
            />
          </div>

          <div>
            <label>Storage Temperature (°C)</label>
            <div className="space-y-2.5">
              <input
                type="number"
                step="0.1"
                value={tempCelsius}
                onChange={(e) => setTempCelsius(e.target.value)}
                placeholder="-80.0"
                className="w-full font-mono text-sm font-bold"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTempCelsius("-80.0")}
                  className="flex-1 py-1.5 text-xs bg-[#FFFFFF] hover:bg-[#EAF2E5] border-2 border-[#162013] rounded-lg text-[#162013] font-extrabold font-mono shadow-[2px_2px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  -80°C
                </button>
                <button
                  type="button"
                  onClick={() => setTempCelsius("-20.0")}
                  className="flex-1 py-1.5 text-xs bg-[#FFFFFF] hover:bg-[#EAF2E5] border-2 border-[#162013] rounded-lg text-[#162013] font-extrabold font-mono shadow-[2px_2px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  -20°C
                </button>
                <button
                  type="button"
                  onClick={() => setTempCelsius("4.0")}
                  className="flex-1 py-1.5 text-xs bg-[#FFFFFF] hover:bg-[#EAF2E5] border-2 border-[#162013] rounded-lg text-[#162013] font-extrabold font-mono shadow-[2px_2px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  +4°C
                </button>
              </div>
            </div>
          </div>

          <div>
            <label>Inspection Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Verified data logger telemetry"
            />
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
            <button type="button" onClick={onClose} className="btn-secondary text-xs w-full sm:w-auto uppercase">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-xs w-full sm:w-auto justify-center uppercase font-extrabold">
              {loading ? "Recording..." : "Record on Chain"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
