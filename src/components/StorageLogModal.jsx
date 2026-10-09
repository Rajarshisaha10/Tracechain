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
      <div className="modal-content max-w-md bg-[#FFFBF1] border-2 border-[#E3D7BC]">
        
        <div className="p-5 border-b-2 border-[#E3D7BC] flex items-center justify-between bg-[#FFFBF1]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DCE6F5] text-[#2457A6] flex items-center justify-center border border-[#BDD0EE]">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1B2B45]">Log Storage & Temperature</h3>
              <p className="text-[11px] text-[#596579] font-mono">{sample.externalId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#F5EEDC] text-[#1B2B45] hover:bg-[#EBDDB8]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#F6D9D4] border border-[#EDB8B3] text-[#C23B30] text-xs font-bold">
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
            <div className="space-y-2">
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
                  className="flex-1 py-1.5 text-xs bg-[#F5EEDC] border-2 border-[#E3D7BC] rounded-lg text-[#2457A6] font-bold hover:border-[#2457A6]"
                >
                  -80°C
                </button>
                <button
                  type="button"
                  onClick={() => setTempCelsius("-20.0")}
                  className="flex-1 py-1.5 text-xs bg-[#F5EEDC] border-2 border-[#E3D7BC] rounded-lg text-[#2457A6] font-bold hover:border-[#2457A6]"
                >
                  -20°C
                </button>
                <button
                  type="button"
                  onClick={() => setTempCelsius("4.0")}
                  className="flex-1 py-1.5 text-xs bg-[#F5EEDC] border-2 border-[#E3D7BC] rounded-lg text-[#2457A6] font-bold hover:border-[#2457A6]"
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

          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs w-full sm:w-auto">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-xs w-full sm:w-auto justify-center">
              {loading ? "Recording..." : "Record on Chain"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
