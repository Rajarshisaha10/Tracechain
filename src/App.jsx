import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChainProvider, useChain } from "./context/ChainContext";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import SampleExplorer from "./components/SampleExplorer";
import CustodyTransfers from "./components/CustodyTransfers";
import AliquotManager from "./components/AliquotManager";
import AuditCompliance from "./components/AuditCompliance";
import DiscrepancyWorkbench from "./components/DiscrepancyWorkbench";
import OrgDirectory from "./components/OrgDirectory";
import NeoTicker from "./components/NeoTicker";

// Modals
import SampleDetailModal from "./components/SampleDetailModal";
import RegisterSampleModal from "./components/RegisterSampleModal";
import TransferModal from "./components/TransferModal";
import StorageLogModal from "./components/StorageLogModal";
import BarcodeModal from "./components/BarcodeModal";

import { shortHash } from "./utils/formatters";
import { ShieldCheck, Cpu } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-[#F7F8F4] text-[#0A0A0A] relative selection:bg-[#D7FB38] selection:text-[#0A0A0A]">
      
      {/* Top Fixed / Sticky Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Real-time Technical Telemetry Ribbon */}
      <NeoTicker />

      {/* Main Content Area - Animated tab transitions */}
      <main className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-14 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {activeTab === "dashboard" && (
              <Dashboard
                onSelectSample={(id) => setInspectSampleId(id)}
                onOpenRegister={() => setRegisterModalOpen(true)}
                onOpenTransfer={() => setActiveTab("custody")}
                onOpenAliquot={() => setActiveTab("lineage")}
                onOpenWorkbench={() => setActiveTab("workbench")}
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

            {activeTab === "workbench" && (
              <DiscrepancyWorkbench
                onSelectSample={(id) => setInspectSampleId(id)}
              />
            )}

            {activeTab === "directory" && (
              <OrgDirectory />
            )}
          </motion.div>
        </AnimatePresence>
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

      {/* Crisp Professional Neo-Brutalist Footer */}
      <footer className="border-t-2 border-[#0A0A0A] bg-[#FFFFFF] px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#0A0A0A] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D7FB38] border-2 border-[#0A0A0A] inline-block animate-pulse"></span>
            <span className="font-extrabold uppercase font-mono tracking-tight text-[11px]">
              TRACECHAIN 2.0 EVM CORE • SOLIDITY ^0.8.20
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Contract: <strong className="bg-[#F3F4F6] px-2 py-0.5 rounded border border-[#0A0A0A] font-bold">{shortHash(contractAddress, 5)}</strong></span>
            <span>•</span>
            <span>Mode: <strong className="bg-[#D7FB38] px-2 py-0.5 rounded border border-[#0A0A0A] font-extrabold uppercase">{mode}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase font-mono text-[#52525B]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0A0A0A]" />
            <span>ISO 20387 Biobanking & 21 CFR §11</span>
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
