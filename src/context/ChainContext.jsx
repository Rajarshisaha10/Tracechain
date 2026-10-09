import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import SampleChainABI from "../contracts/SampleChainABI.json";
import { SAMPLE_CHAIN_ADDRESS, NETWORK_CHAIN_ID } from "../contracts/contractAddress";
import { buildInitialDemoState, DEMO_ORGS } from "../utils/mockData";
import { computeSampleId, computeRecordHash, verifyClientChain, hashString } from "../utils/crypto";

const ChainContext = createContext(null);

export function ChainProvider({ children }) {
  // Mode: "sandbox" (default rich demo) or "web3" (MetaMask/EVM)
  const [mode, setMode] = useState("sandbox");
  
  // Web3 state
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [web3Error, setWeb3Error] = useState("");

  // Sandbox state
  const [sandboxData, setSandboxData] = useState(() => {
    try {
      const saved = localStorage.getItem("tracechain_sandbox_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Error reading sandbox state from localStorage", e);
    }
    return buildInitialDemoState();
  });

  // Active identity in sandbox mode (defaults to Memorial Sloan Bio-Center / Hospital)
  const [activeAccount, setActiveAccount] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

  // Save sandbox data on change
  useEffect(() => {
    try {
      localStorage.setItem("tracechain_sandbox_v2", JSON.stringify(sandboxData));
    } catch (e) {
      console.warn("Failed to persist sandbox state", e);
    }
  }, [sandboxData]);

  // Check for existing web3 wallet
  useEffect(() => {
    if (window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress("");
        }
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  // Connect Web3 Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setWeb3Error("No Web3 wallet found (e.g. MetaMask). Please install an EVM extension or use Sandbox mode.");
      return;
    }
    try {
      setIsConnecting(true);
      setWeb3Error("");
      const p = new ethers.BrowserProvider(window.ethereum);
      const s = await p.getSigner();
      const addr = await s.getAddress();
      const network = await p.getNetwork();

      setProvider(p);
      setSigner(s);
      setWalletAddress(addr);
      setChainId(Number(network.chainId));

      if (SAMPLE_CHAIN_ADDRESS && SampleChainABI) {
        const c = new ethers.Contract(SAMPLE_CHAIN_ADDRESS, SampleChainABI, s);
        setContract(c);
      }

      setMode("web3");
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setWeb3Error(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  // Reset sandbox to initial seed data
  const resetSandbox = () => {
    const initial = buildInitialDemoState();
    setSandboxData(initial);
    localStorage.removeItem("tracechain_sandbox_v2");
  };

  // Helper: Active user profile info
  const currentActor = mode === "web3"
    ? {
        address: walletAddress || "0x0000000000000000000000000000000000000000",
        name: walletAddress ? `Wallet (${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)})` : "Not connected",
        orgType: 1, // Default assume Hospital or lookup
        orgTypeName: "Web3 Signer",
        country: "US",
        active: true,
      }
    : sandboxData.orgs[activeAccount] || {
        address: activeAccount,
        name: "Custom Account",
        orgType: 1,
        orgTypeName: "Hospital",
        country: "US",
        active: true,
      };

  // -------------------------------------------------------------
  // Operations (Handles both Sandbox and Web3 Contract calls)
  // -------------------------------------------------------------

  const registerSample = async ({ externalId, sampleType, collectedAt, consentHash, subjectHash, note }) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.registerSample({
        externalId,
        sampleType,
        collectedAt: Math.floor(new Date(collectedAt).getTime() / 1000) || Math.floor(Date.now() / 1000),
        consentHash: consentHash || ethers.ZeroHash,
        subjectHash: subjectHash || ethers.ZeroHash,
        note: note || "Registered via Tracechain DApp",
      });
      return await tx.wait();
    }

    // Sandbox execution
    const creator = activeAccount;
    const sampleId = computeSampleId(creator, externalId);
    if (sandboxData.samples[sampleId]) {
      throw new Error("Sample already exists with this ID for this organization!");
    }

    const timestampSec = Math.floor(Date.now() / 1000);
    const initialRec = {
      recType: 0, // Collected
      actor: creator,
      timestamp: timestampSec,
      dataHash: consentHash || ethers.ZeroHash,
      temp: -2147483648,
      note: note || "Specimen collected and sealed",
      uri: "",
      prevHash: sampleId,
    };
    initialRec.recordHash = computeRecordHash(initialRec);

    const newSample = {
      sampleId,
      externalId,
      sampleType,
      origin: creator,
      creator,
      collectedAt: Math.floor(new Date(collectedAt).getTime() / 1000) || timestampSec,
      consentHash: consentHash || ethers.ZeroHash,
      subjectHash: subjectHash || ethers.ZeroHash,
      parentId: ethers.ZeroHash,
      custodian: creator,
      pendingRecipient: ethers.ZeroAddress,
      status: 1, // Active
      headHash: initialRec.recordHash,
    };

    setSandboxData((prev) => ({
      ...prev,
      samples: { ...prev.samples, [sampleId]: newSample },
      histories: { ...prev.histories, [sampleId]: [initialRec] },
      allSampleIds: [sampleId, ...prev.allSampleIds],
    }));

    return { sampleId, hash: initialRec.recordHash };
  };

  const createAliquot = async ({ parentId, externalId, sampleType, note }) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.createAliquot(parentId, externalId, sampleType, note || "Aliquot created");
      return await tx.wait();
    }

    const creator = activeAccount;
    const parent = sandboxData.samples[parentId];
    if (!parent) throw new Error("Parent sample not found");
    if (parent.custodian.toLowerCase() !== creator.toLowerCase()) {
      throw new Error("Only the current custodian can create an aliquot from this specimen");
    }

    const childId = computeSampleId(creator, externalId);
    if (sandboxData.samples[childId]) {
      throw new Error("Sample with this barcode already exists");
    }

    const timestampSec = Math.floor(Date.now() / 1000);

    // Parent history update
    const parentHist = sandboxData.histories[parentId] || [];
    const parentPrev = parent.headHash;
    const parentRec = {
      recType: 1, // AliquotCreated
      actor: creator,
      timestamp: timestampSec,
      dataHash: childId,
      temp: -2147483648,
      note: note || `Split child aliquot: ${externalId}`,
      uri: "",
      prevHash: parentPrev,
    };
    parentRec.recordHash = computeRecordHash(parentRec);

    // Child initial history
    const childRec = {
      recType: 2, // DerivedFrom
      actor: creator,
      timestamp: timestampSec,
      dataHash: parentId,
      temp: -2147483648,
      note: note || `Derived from parent: ${parent.externalId}`,
      uri: "",
      prevHash: childId,
    };
    childRec.recordHash = computeRecordHash(childRec);

    const childSample = {
      sampleId: childId,
      externalId,
      sampleType,
      origin: parent.origin,
      creator,
      collectedAt: parent.collectedAt,
      consentHash: parent.consentHash,
      subjectHash: parent.subjectHash,
      parentId,
      custodian: creator,
      pendingRecipient: ethers.ZeroAddress,
      status: 1, // Active
      headHash: childRec.recordHash,
    };

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [parentId]: { ...parent, headHash: parentRec.recordHash },
        [childId]: childSample,
      },
      histories: {
        ...prev.histories,
        [parentId]: [...parentHist, parentRec],
        [childId]: [childRec],
      },
      childrenMap: {
        ...prev.childrenMap,
        [parentId]: [...(prev.childrenMap[parentId] || []), childId],
      },
      allSampleIds: [childId, ...prev.allSampleIds],
    }));

    return { childId };
  };

  const initiateTransfer = async (sampleId, toAddress, note) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.initiateTransfer(sampleId, toAddress, note || "Transfer dispatched");
      return await tx.wait();
    }

    const s = sandboxData.samples[sampleId];
    if (!s) throw new Error("Sample not found");
    if (s.custodian.toLowerCase() !== activeAccount.toLowerCase()) {
      throw new Error("Only the current custodian can transfer this sample");
    }
    if (s.status !== 1) throw new Error("Only active samples can be transferred");

    const timestampSec = Math.floor(Date.now() / 1000);
    const rec = {
      recType: 3, // TransferInitiated
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: ethers.zeroPadValue(toAddress, 32),
      temp: -2147483648,
      note: note || `Dispatched to recipient: ${toAddress}`,
      uri: "",
      prevHash: s.headHash,
    };
    rec.recordHash = computeRecordHash(rec);

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [sampleId]: {
          ...s,
          pendingRecipient: toAddress,
          status: 2, // InTransit
          headHash: rec.recordHash,
        },
      },
      histories: {
        ...prev.histories,
        [sampleId]: [...(prev.histories[sampleId] || []), rec],
      },
    }));
  };

  const acceptTransfer = async (sampleId, intact, note) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.acceptTransfer(sampleId, intact, note || "Transfer accepted");
      return await tx.wait();
    }

    const s = sandboxData.samples[sampleId];
    if (!s) throw new Error("Sample not found");
    if (s.pendingRecipient.toLowerCase() !== activeAccount.toLowerCase()) {
      throw new Error("You are not the designated recipient of this transfer");
    }

    const timestampSec = Math.floor(Date.now() / 1000);
    const rec = {
      recType: 4, // TransferAccepted
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: ethers.toBeHex(intact ? 1 : 0, 32),
      temp: -2147483648,
      note: intact ? (note || "Delivery accepted in intact condition") : `COMPROMISED ARRIVAL: ${note || "Damaged/out of spec"}`,
      uri: "",
      prevHash: s.headHash,
    };
    rec.recordHash = computeRecordHash(rec);

    const newStatus = intact ? 1 : 3; // Active if intact, Quarantined if damaged!
    let updatedHistory = [...(sandboxData.histories[sampleId] || []), rec];
    let newHead = rec.recordHash;

    if (!intact) {
      // Auto-quarantine record
      const qRec = {
        recType: 11, // Quarantined
        actor: activeAccount,
        timestamp: timestampSec + 1,
        dataHash: ethers.ZeroHash,
        temp: -2147483648,
        note: "Auto-quarantined on arrival due to compromised condition",
        uri: "",
        prevHash: newHead,
      };
      qRec.recordHash = computeRecordHash(qRec);
      updatedHistory.push(qRec);
      newHead = qRec.recordHash;
    }

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [sampleId]: {
          ...s,
          custodian: activeAccount,
          pendingRecipient: ethers.ZeroAddress,
          status: newStatus,
          headHash: newHead,
        },
      },
      histories: {
        ...prev.histories,
        [sampleId]: updatedHistory,
      },
    }));
  };

  const rejectTransfer = async (sampleId, reason) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.rejectTransfer(sampleId, reason || "Transfer rejected");
      return await tx.wait();
    }

    const s = sandboxData.samples[sampleId];
    if (!s) throw new Error("Sample not found");
    if (s.pendingRecipient.toLowerCase() !== activeAccount.toLowerCase()) {
      throw new Error("You are not the designated recipient of this transfer");
    }

    const timestampSec = Math.floor(Date.now() / 1000);
    const rec = {
      recType: 5, // TransferRejected
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: ethers.ZeroHash,
      temp: -2147483648,
      note: reason || "Transfer rejected by recipient",
      uri: "",
      prevHash: s.headHash,
    };
    rec.recordHash = computeRecordHash(rec);

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [sampleId]: {
          ...s,
          pendingRecipient: ethers.ZeroAddress,
          status: 1, // Remains with original custodian
          headHash: rec.recordHash,
        },
      },
      histories: {
        ...prev.histories,
        [sampleId]: [...(prev.histories[sampleId] || []), rec],
      },
    }));
  };

  const logStorage = async (sampleId, location, tempCx10, note) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.logStorage(sampleId, location, tempCx10, note || "");
      return await tx.wait();
    }

    const s = sandboxData.samples[sampleId];
    if (!s) throw new Error("Sample not found");
    if (s.custodian.toLowerCase() !== activeAccount.toLowerCase()) {
      throw new Error("Only current custodian can log storage");
    }

    const timestampSec = Math.floor(Date.now() / 1000);
    const rec = {
      recType: 7, // Storage
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: ethers.ZeroHash,
      temp: Number(tempCx10),
      note: note ? `${location} | ${note}` : location,
      uri: "",
      prevHash: s.headHash,
    };
    rec.recordHash = computeRecordHash(rec);

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [sampleId]: { ...s, headHash: rec.recordHash },
      },
      histories: {
        ...prev.histories,
        [sampleId]: [...(prev.histories[sampleId] || []), rec],
      },
    }));
  };

  const logHandling = async (sampleId, action, note) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.logHandling(sampleId, action, note || "");
      return await tx.wait();
    }

    const s = sandboxData.samples[sampleId];
    if (!s) throw new Error("Sample not found");
    if (s.custodian.toLowerCase() !== activeAccount.toLowerCase()) {
      throw new Error("Only current custodian can log handling");
    }

    const timestampSec = Math.floor(Date.now() / 1000);
    const rec = {
      recType: 8, // Handling
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: hashString(action),
      temp: -2147483648,
      note: note ? `${action} | ${note}` : action,
      uri: "",
      prevHash: s.headHash,
    };
    rec.recordHash = computeRecordHash(rec);

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [sampleId]: { ...s, headHash: rec.recordHash },
      },
      histories: {
        ...prev.histories,
        [sampleId]: [...(prev.histories[sampleId] || []), rec],
      },
    }));
  };

  const recordTest = async (sampleId, testName, resultHash, uri) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.recordTest(sampleId, testName, resultHash, uri || "");
      return await tx.wait();
    }

    const s = sandboxData.samples[sampleId];
    if (!s) throw new Error("Sample not found");
    if (s.custodian.toLowerCase() !== activeAccount.toLowerCase()) {
      throw new Error("Only current custodian can record test results");
    }

    const timestampSec = Math.floor(Date.now() / 1000);
    const rec = {
      recType: 9, // Test
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: resultHash,
      temp: -2147483648,
      note: testName,
      uri: uri || "",
      prevHash: s.headHash,
    };
    rec.recordHash = computeRecordHash(rec);

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [sampleId]: { ...s, headHash: rec.recordHash },
      },
      histories: {
        ...prev.histories,
        [sampleId]: [...(prev.histories[sampleId] || []), rec],
      },
    }));
  };

  const logIncident = async (sampleId, description, evidenceHash, uri) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.logIncident(sampleId, description, evidenceHash || ethers.ZeroHash, uri || "");
      return await tx.wait();
    }

    const s = sandboxData.samples[sampleId];
    if (!s) throw new Error("Sample not found");

    const timestampSec = Math.floor(Date.now() / 1000);
    const rec = {
      recType: 10, // Incident
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: evidenceHash || ethers.ZeroHash,
      temp: -2147483648,
      note: description,
      uri: uri || "",
      prevHash: s.headHash,
    };
    rec.recordHash = computeRecordHash(rec);

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [sampleId]: { ...s, headHash: rec.recordHash },
      },
      histories: {
        ...prev.histories,
        [sampleId]: [...(prev.histories[sampleId] || []), rec],
      },
    }));
  };

  const quarantine = async (sampleId, reason) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.quarantine(sampleId, reason);
      return await tx.wait();
    }

    const s = sandboxData.samples[sampleId];
    if (!s) throw new Error("Sample not found");

    const timestampSec = Math.floor(Date.now() / 1000);
    const rec = {
      recType: 11, // Quarantined
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: ethers.ZeroHash,
      temp: -2147483648,
      note: reason || "Quarantined by compliance authority",
      uri: "",
      prevHash: s.headHash,
    };
    rec.recordHash = computeRecordHash(rec);

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [sampleId]: { ...s, status: 3, headHash: rec.recordHash },
      },
      histories: {
        ...prev.histories,
        [sampleId]: [...(prev.histories[sampleId] || []), rec],
      },
    }));
  };

  const release = async (sampleId, note) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.release(sampleId, note || "Released");
      return await tx.wait();
    }

    const s = sandboxData.samples[sampleId];
    if (!s) throw new Error("Sample not found");

    const timestampSec = Math.floor(Date.now() / 1000);
    const rec = {
      recType: 12, // Released
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: ethers.ZeroHash,
      temp: -2147483648,
      note: note || "Released from quarantine after audit approval",
      uri: "",
      prevHash: s.headHash,
    };
    rec.recordHash = computeRecordHash(rec);

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [sampleId]: { ...s, status: 1, headHash: rec.recordHash },
      },
      histories: {
        ...prev.histories,
        [sampleId]: [...(prev.histories[sampleId] || []), rec],
      },
    }));
  };

  // Tamper demonstration for auditor & educational security testing
  const tamperRecord = (sampleId, recordIndex, tamperedNote) => {
    const history = [...(sandboxData.histories[sampleId] || [])];
    if (!history[recordIndex]) return;

    // Mutate the record text without updating the cryptographic hash
    history[recordIndex] = {
      ...history[recordIndex],
      note: tamperedNote || "[TAMPERED DATA - UNAUTHORIZED EDIT]",
    };

    setSandboxData((prev) => ({
      ...prev,
      histories: {
        ...prev.histories,
        [sampleId]: history,
      },
    }));
  };

  // Register Org (Admin only)
  const registerOrg = async ({ address, name, orgType, country, accreditationHash }) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const countryBytes = ethers.encodeBytes32String(country.slice(0, 2).toUpperCase()).slice(0, 6);
      const tx = await contract.registerOrg(address, name, Number(orgType), countryBytes, accreditationHash || ethers.ZeroHash);
      return await tx.wait();
    }

    const orgTypeNames = ["Admin", "Hospital", "Laboratory", "Research Facility", "Logistics Courier", "Regulatory Auditor"];

    const newOrg = {
      address,
      name,
      orgType: Number(orgType),
      orgTypeName: orgTypeNames[Number(orgType)] || "Unknown",
      country: country.toUpperCase(),
      active: true,
      accreditationHash: accreditationHash || ethers.ZeroHash,
      registeredAt: Date.now(),
    };

    setSandboxData((prev) => ({
      ...prev,
      orgs: {
        ...prev.orgs,
        [address]: newOrg,
      },
    }));
  };

  return (
    <ChainContext.Provider
      value={{
        mode,
        setMode,
        activeAccount,
        setActiveAccount,
        currentActor,
        sandboxData,
        resetSandbox,
        // Web3
        connectWallet,
        walletAddress,
        chainId,
        isConnecting,
        web3Error,
        contractAddress: SAMPLE_CHAIN_ADDRESS,
        // Methods
        registerSample,
        createAliquot,
        initiateTransfer,
        acceptTransfer,
        rejectTransfer,
        logStorage,
        logHandling,
        recordTest,
        logIncident,
        quarantine,
        release,
        tamperRecord,
        registerOrg,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
}

export function useChain() {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error("useChain must be used within ChainProvider");
  return ctx;
}
