import React, { useState } from "react";
import { ChainProvider, useChain } from "./context/ChainContext";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import SampleExplorer from "./components/SampleExplorer";
import CustodyTransfers from "./components/CustodyTransfers";
import AliquotManager from "./components/AliquotManager";
import AuditCompliance from "./components/AuditCompliance";
import OrgDirectory from "./components/OrgDirectory";
import NeoTicker from "./components/NeoTicker";

// Modals
import SampleDetailModal from "./components/SampleDetailModal";
import RegisterSampleModal from "./components/RegisterSampleModal";
import TransferModal from "./components/TransferModal";
import StorageLogModal from "./components/StorageLogModal";
import BarcodeModal from "./components/BarcodeModal";

import { shortHash } from "./utils/formatters";

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
    <div className="min-h-screen flex flex-col bg-[#F4F7F1] text-[#162013] relative selection:bg-[#8FB339] selection:text-[#162013]">
      
      {/* Top Navbar & Mobile Bottom Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Neo-Brutalist Live Blockchain & Telemetry Marquee */}
      <NeoTicker />

      {/* Main Container with Mobile Bottom Spacing */}
      <main className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 pb-24 md:pb-8">
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

      {/* Desktop Footer */}
      <footer className="hidden md:block border-t-[2.5px] border-[#162013] bg-[#FFFFFF] px-4 lg:px-8 py-5 text-xs text-[#33442E] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-[#435E2F] border-2 border-[#162013] flex items-center justify-center shadow-[1.5px_1.5px_0px_#162013]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]"></div>
            </div>
            <span className="font-extrabold tracking-tight text-[#162013] uppercase">
              Tracechain EVM Core • Solidity ^0.8.20
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Contract: <span className="text-[#2A3D1D] font-bold bg-[#EAF2E5] px-2 py-0.5 rounded border border-[#162013]">{shortHash(contractAddress, 5)}</span></span>
            <span>•</span>
            <span>Mode: <span className="text-[#162013] font-extrabold uppercase bg-[#8FB339] px-2.5 py-0.5 rounded-full border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013]">{mode}</span></span>
          </div>

          <div className="text-[11px] text-[#5D7057] font-bold tracking-wide uppercase">
            ISO 20387 Biobanking & 21 CFR Part 11 Integrity
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
