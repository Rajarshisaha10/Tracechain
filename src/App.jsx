import React, { useState } from "react";
import { ChainProvider, useChain } from "./context/ChainContext";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import SampleExplorer from "./components/SampleExplorer";
import CustodyTransfers from "./components/CustodyTransfers";
import AliquotManager from "./components/AliquotManager";
import AuditCompliance from "./components/AuditCompliance";
import OrgDirectory from "./components/OrgDirectory";

// Modals
import SampleDetailModal from "./components/SampleDetailModal";
import RegisterSampleModal from "./components/RegisterSampleModal";
import TransferModal from "./components/TransferModal";
import StorageLogModal from "./components/StorageLogModal";
import BarcodeModal from "./components/BarcodeModal";

import { shortHash } from "./utils/formatters";
import { ShieldCheck } from "lucide-react";

function MainContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { contractAddress, mode } = useChain();

  // Modal states
  const [inspectSampleId, setInspectSampleId] = useState(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [transferSample, setTransferSample] = useState(null);
  const [storageSample, setStorageSample] = useState(null);
  const [qrSample, setQrSample] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EEDC] text-[#1B2B45]">
      
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex-1">
        {activeTab === "dashboard" && (
          <Dashboard
            onSelectSample={(id) => setInspectSampleId(id)}
            onOpenRegister={() => setRegisterModalOpen(true)}
            onOpenTransfer={() => setActiveTab("custody")}
            onOpenAliquot={() => setActiveTab("lineage")}
          />
        )}

        {activeTab === "samples" && (
          <SampleExplorer
            onSelectSample={(id) => setInspectSampleId(id)}
            onOpenRegister={() => setRegisterModalOpen(true)}
            onOpenTransfer={(s) => setTransferSample(s)}
            onOpenAliquot={(s) => setActiveTab("lineage")}
            onOpenStorage={(s) => setStorageSample(s)}
            onOpenQr={(s) => setQrSample(s)}
          />
        )}

        {activeTab === "custody" && (
          <CustodyTransfers
            onSelectSample={(id) => setInspectSampleId(id)}
          />
        )}

        {activeTab === "lineage" && (
          <AliquotManager
            onSelectSample={(id) => setInspectSampleId(id)}
          />
        )}

        {activeTab === "compliance" && (
          <AuditCompliance
            onSelectSample={(id) => setInspectSampleId(id)}
          />
        )}

        {activeTab === "directory" && (
          <OrgDirectory />
        )}
      </main>

      {/* Modals */}
      {inspectSampleId && (
        <SampleDetailModal
          sampleId={inspectSampleId}
          onClose={() => setInspectSampleId(null)}
          onOpenTransfer={(s) => setTransferSample(s)}
          onOpenStorage={(s) => setStorageSample(s)}
          onOpenAliquot={(s) => {
            setInspectSampleId(null);
            setActiveTab("lineage");
          }}
          onOpenQr={(s) => setQrSample(s)}
        />
      )}

      {registerModalOpen && (
        <RegisterSampleModal
          onClose={() => setRegisterModalOpen(false)}
          onSuccess={() => setActiveTab("samples")}
        />
      )}

      {transferSample && (
        <TransferModal
          sample={transferSample}
          onClose={() => setTransferSample(null)}
          onSuccess={() => setActiveTab("custody")}
        />
      )}

      {storageSample && (
        <StorageLogModal
          sample={storageSample}
          onClose={() => setStorageSample(null)}
          onSuccess={() => {}}
        />
      )}

      {qrSample && (
        <BarcodeModal
          sample={qrSample}
          onClose={() => setQrSample(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t-2 border-[#E3D7BC] bg-[#FFFBF1] px-4 lg:px-8 py-6 text-xs text-[#596579] mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-md bg-[#C23B30] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#F5EEDC]"></div>
            </div>
            <span className="font-semibold text-[#1B2B45]">
              Tracechain EVM Core • Solidity ^0.8.20 • Hash-Chain Anchored
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Contract: <span className="text-[#2457A6] font-bold">{shortHash(contractAddress, 6)}</span></span>
            <span>•</span>
            <span>Mode: <span className="text-[#2457A6] font-bold uppercase bg-[#DCE6F5] px-2 py-0.5 rounded-full border border-[#BDD0EE]">{mode}</span></span>
          </div>

          <div className="text-[11px] text-[#6B7287] font-medium">
            ISO 20387 Biobanking & 21 CFR Part 11 Audit Integrity
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <ChainProvider>
      <MainContent />
    </ChainProvider>
  );
}
