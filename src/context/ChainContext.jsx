import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import SampleChainABI from "../contracts/SampleChainABI.json";
import { SAMPLE_CHAIN_ADDRESS, NETWORK_CHAIN_ID } from "../contracts/contractAddress";
import { buildInitialDemoState, DEMO_ORGS } from "../utils/mockData";
import {
  computeSampleId,
  computeRecordHash,
  verifyClientChain,
  hashString,
  computeReportPayloadHash,
  generateSimulatedSignature
} from "../utils/crypto";
import {
  generateBlindId,
  registerIdentityMapping,
  resolveIdentity,
  lookupBlindId
} from "../services/identityMappingService";

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
    try {
      localStorage.removeItem("tracechain_sandbox_v2");
      localStorage.removeItem("tracechain_identity_vault_v2");
    } catch (e) {
      console.warn("Storage reset error", e);
    }
    const initial = buildInitialDemoState();
    setSandboxData(initial);
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

  const registerSample = async ({
    externalId,
    sampleType,
    collectedAt,
    consentHash,
    subjectHash,
    note,
    blindId,
    patientData,
    baselineMetric
  }) => {
    const chosenBlindId = blindId || generateBlindId();

    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.registerSampleBlind(
        {
          externalId,
          sampleType,
          collectedAt: Math.floor(new Date(collectedAt).getTime() / 1000) || Math.floor(Date.now() / 1000),
          consentHash: consentHash || ethers.ZeroHash,
          subjectHash: subjectHash || ethers.ZeroHash,
          note: note || "Registered via Tracechain DApp",
        },
        chosenBlindId
      );
      const receipt = await tx.wait();
      const sampleId = computeSampleId(walletAddress, externalId);

      // Register off-chain privacy mapping for authorized collector
      registerIdentityMapping({
        sampleId,
        externalId,
        blindId: chosenBlindId,
        patientData,
        creatorAddress: walletAddress
      });

      return receipt;
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
      blindId: chosenBlindId,
      baselineMetric: baselineMetric || {
        name: "Biomarker Concentration",
        value: 50.0,
        unit: "ng/µL",
        tolerance: 15,
        expectedQualitative: "NEGATIVE"
      },
    };

    // Store off-chain identity mapping
    registerIdentityMapping({
      sampleId,
      externalId,
      blindId: chosenBlindId,
      patientData,
      creatorAddress: creator
    });

    setSandboxData((prev) => ({
      ...prev,
      samples: { ...prev.samples, [sampleId]: newSample },
      histories: { ...prev.histories, [sampleId]: [initialRec] },
      allSampleIds: [sampleId, ...prev.allSampleIds],
    }));

    return { sampleId, hash: initialRec.recordHash, blindId: chosenBlindId };
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
      blindId: parent.blindId ? `${parent.blindId}-ALQ` : generateBlindId(),
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

  // -------------------------------------------------------------
  // FEATURE TWO: ATTESTED LABORATORY REPORTS
  // -------------------------------------------------------------
  const recordAttestedTest = async ({ sampleId, testType, reportHash, findings, uri, measuredValue, measuredUnit, autoFlagDiscrepancy = true, attestingLabAddress = null }) => {
    if (mode === "web3") {
      if (!contract || !signer) throw new Error("Contract or wallet signer not connected");
      const currentReports = await contract.getAttestedReports(sampleId);
      const currentVer = currentReports.length + 1;
      const providerNetwork = await provider.getNetwork();
      const currentBlock = await provider.getBlock("latest");
      const nowTs = currentBlock.timestamp + 1;

      const payloadHash = computeReportPayloadHash(
        sampleId,
        walletAddress,
        testType,
        reportHash,
        findings,
        currentVer,
        nowTs
      );
      const signature = await signer.signMessage(ethers.getBytes(payloadHash));

      const tx = await contract.recordAttestedTest(
        sampleId,
        testType,
        reportHash,
        findings,
        uri || "",
        signature
      );
      return await tx.wait();
    }

    // Sandbox execution
    const s = sandboxData.samples[sampleId];
    if (!s) throw new Error("Sample not found");

    // In sandbox demo mode, default to active account if laboratory, else Apex Genomics Core Lab
    const effectiveLabAddress = attestingLabAddress || (
      (currentActor.orgType === 2 || currentActor.orgType === 3)
        ? activeAccount
        : "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    );
    const labOrg = sandboxData.orgs[effectiveLabAddress] || currentActor;

    // Automatically set custody to the testing laboratory
    s.custodian = effectiveLabAddress;
    s.status = 1; // Active in laboratory custody

    if (activeAccount.toLowerCase() !== effectiveLabAddress.toLowerCase()) {
      setActiveAccount(effectiveLabAddress);
    }

    const existingReports = sandboxData.attestedReports?.[sampleId] || [];
    const currentVer = existingReports.length + 1;
    const timestampSec = Math.floor(Date.now() / 1000);

    const payloadHash = computeReportPayloadHash(
      sampleId,
      effectiveLabAddress,
      testType,
      reportHash,
      findings,
      currentVer,
      timestampSec
    );
    const signature = generateSimulatedSignature(effectiveLabAddress, payloadHash);

    const numMeasured = (measuredValue !== undefined && measuredValue !== null && measuredValue !== "") ? parseFloat(measuredValue) : null;
    let variancePct = null;
    let isOutOfTolerance = false;
    const baseline = s.baselineMetric;

    if (numMeasured !== null && !isNaN(numMeasured) && baseline && Number(baseline.value) > 0) {
      const expectedNum = Number(baseline.value);
      variancePct = Number((((numMeasured - expectedNum) / expectedNum) * 100).toFixed(1));
      const tolerance = Number(baseline.tolerance || 15);
      isOutOfTolerance = Math.abs(variancePct) > tolerance;
    }

    const unitStr = measuredUnit || baseline?.unit || "";

    const newReport = {
      sampleId,
      laboratory: effectiveLabAddress,
      testType,
      reportHash,
      findings,
      reportVersion: currentVer,
      timestamp: timestampSec,
      signature,
      uri: uri || "",
      isRetest: false,
      originalReportHash: ethers.ZeroHash,
      measuredValue: numMeasured,
      measuredUnit: unitStr,
      baselineValue: baseline?.value,
      variancePct: variancePct,
      isOutOfTolerance: isOutOfTolerance,
    };

    let noteStr = currentVer === 1
      ? `Attested Report v1: ${testType} [${findings}]`
      : `Superceded Attested Report v${currentVer}: ${testType} [${findings}]`;

    if (numMeasured !== null) {
      noteStr += isOutOfTolerance
        ? ` [⚠️ VARIANCE WARNING: Measured ${numMeasured} ${unitStr} vs Baseline ${baseline?.value} ${unitStr} (${variancePct > 0 ? '+' : ''}${variancePct}% exceeds tolerance ±${baseline?.tolerance}%)]`
        : ` [✓ CONCORDANT: Measured ${numMeasured} ${unitStr} (${variancePct > 0 ? '+' : ''}${variancePct}% within tolerance)]`;
    }

    // Auto-create discrepancy case if measurement is out of tolerance
    const updatedDiscrepancies = { ...(sandboxData.discrepancyCases || {}) };
    const updatedSampleDiscrepancies = { ...(sandboxData.sampleDiscrepancyCases || {}) };
    const updatedAllDiscrepancyCaseIds = [...(sandboxData.allDiscrepancyCaseIds || [])];

    if (isOutOfTolerance && autoFlagDiscrepancy) {
      const caseId = `CASE-VAR-${Date.now().toString(36).slice(-5).toUpperCase()}`;
      const newCase = {
        caseId,
        sampleId,
        requestId: "",
        originalReportHash: reportHash,
        retestReportHash: ethers.ZeroHash,
        originalLab: effectiveLabAddress,
        retestLab: ethers.ZeroAddress,
        reason: `Quantitative Assay Discrepancy: Laboratory measured ${numMeasured} ${unitStr} vs registered baseline ${baseline?.value} ${unitStr} (${variancePct > 0 ? '+' : ''}${variancePct}% variance, exceeding acceptable ±${baseline?.tolerance}% tolerance).`,
        evidenceHash: reportHash,
        status: 0, // Open
        disposition: 0,
        resolutionReason: "",
        reviewer: ethers.ZeroAddress,
        flaggedAt: timestampSec,
        resolvedAt: 0,
        isMeasurementDiscrepancy: true,
        baselineValue: baseline?.value,
        measuredValue: numMeasured,
        unit: unitStr,
        variancePct: variancePct,
        tolerancePct: baseline?.tolerance || 15
      };

      updatedDiscrepancies[caseId] = newCase;
      updatedSampleDiscrepancies[sampleId] = [...(updatedSampleDiscrepancies[sampleId] || []), caseId];
      if (!updatedAllDiscrepancyCaseIds.includes(caseId)) {
        updatedAllDiscrepancyCaseIds.unshift(caseId);
      }
    }

    const rec = {
      recType: 16, // ReportAttested
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: reportHash,
      temp: -2147483648,
      note: noteStr,
      uri: uri || "",
      prevHash: s.headHash,
    };
    rec.recordHash = computeRecordHash(rec);

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [sampleId]: { 
          ...s, 
          headHash: rec.recordHash,
          hasValueWarning: isOutOfTolerance || s.hasValueWarning,
          latestVarianceWarning: isOutOfTolerance ? {
            measuredValue: numMeasured,
            baselineValue: baseline?.value,
            unit: unitStr,
            variancePct,
            tolerancePct: baseline?.tolerance
          } : s.latestVarianceWarning
        },
      },
      histories: {
        ...prev.histories,
        [sampleId]: [...(prev.histories[sampleId] || []), rec],
      },
      attestedReports: {
        ...prev.attestedReports,
        [sampleId]: [...existingReports, newReport],
      },
      discrepancyCases: updatedDiscrepancies,
      sampleDiscrepancyCases: updatedSampleDiscrepancies,
      allDiscrepancyCaseIds: updatedAllDiscrepancyCaseIds,
    }));

    return { version: currentVer, signature, payloadHash };
  };

  // -------------------------------------------------------------
  // FEATURE THREE: INDEPENDENT RETESTING WORKFLOW
  // -------------------------------------------------------------
  const requestIndependentRetest = async ({ sampleId, designatedLab, reason }) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.requestIndependentRetest(sampleId, designatedLab, reason);
      return await tx.wait();
    }

    // Sandbox execution
    if (currentActor.orgType !== 5 && currentActor.orgType !== 0) {
      throw new Error("Unauthorized: Only compliance auditors or network governance can order independent retests");
    }

    const s = sandboxData.samples[sampleId];
    if (!s) throw new Error("Sample not found");

    const reports = sandboxData.attestedReports?.[sampleId] || [];
    if (reports.length === 0) {
      throw new Error("No prior attested report found to verify");
    }
    const latestRep = reports[reports.length - 1];

    if (designatedLab.toLowerCase() === latestRep.laboratory.toLowerCase()) {
      throw new Error("Independence violation: The secondary testing laboratory must differ from the initial testing organization");
    }

    const targetOrg = sandboxData.orgs[designatedLab];
    if (!targetOrg || (targetOrg.orgType !== 2 && targetOrg.orgType !== 3)) {
      throw new Error("Designated retesting entity must be an accredited Laboratory or Research facility");
    }

    const timestampSec = Math.floor(Date.now() / 1000);
    const requestId = ethers.keccak256(
      ethers.solidityPacked(
        ["bytes32", "address", "uint256"],
        [sampleId, designatedLab, timestampSec]
      )
    );

    const newRequest = {
      requestId,
      sampleId,
      initiator: activeAccount,
      originalLab: latestRep.laboratory,
      designatedLab,
      originalReportHash: latestRep.reportHash,
      reason,
      requestedAt: timestampSec,
      completed: false,
      retestReportHash: ethers.ZeroHash,
    };

    const rec = {
      recType: 17, // RetestRequested
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: requestId,
      temp: -2147483648,
      note: `Independent retest requested. Assigned: ${targetOrg.name} | ${reason}`,
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
      retestRequests: {
        ...prev.retestRequests,
        [requestId]: newRequest,
      },
      sampleRetestRequests: {
        ...prev.sampleRetestRequests,
        [sampleId]: [...(prev.sampleRetestRequests?.[sampleId] || []), requestId],
      },
      allRetestRequestIds: [requestId, ...(prev.allRetestRequestIds || [])],
    }));

    return { requestId };
  };

  const recordRetestReport = async ({ requestId, reportHash, findings, uri }) => {
    if (mode === "web3") {
      if (!contract || !signer) throw new Error("Contract or wallet signer not connected");
      const req = await contract.getRetestRequest(requestId);
      const currentBlock = await provider.getBlock("latest");
      const nowTs = currentBlock.timestamp + 1;

      const payloadHash = computeReportPayloadHash(
        req.sampleId,
        walletAddress,
        "Independent Retest Verification",
        reportHash,
        findings,
        1,
        nowTs
      );
      const signature = await signer.signMessage(ethers.getBytes(payloadHash));

      const tx = await contract.recordRetestReport(requestId, reportHash, findings, uri || "", signature);
      return await tx.wait();
    }

    // Sandbox execution
    const req = sandboxData.retestRequests?.[requestId];
    if (!req) throw new Error("Retest request not found");
    if (req.completed) throw new Error("Retest request has already been recorded");
    if (req.designatedLab.toLowerCase() !== activeAccount.toLowerCase()) {
      throw new Error("Unauthorized: Only the designated secondary laboratory can record this retest");
    }
    if (req.originalLab.toLowerCase() === activeAccount.toLowerCase()) {
      throw new Error("Independence violation: The original laboratory cannot submit retest verification results");
    }

    const s = sandboxData.samples[req.sampleId];
    if (!s) throw new Error("Sample not found");
    if (s.custodian.toLowerCase() !== activeAccount.toLowerCase()) {
      throw new Error("Physical custody required: Specimen must be transferred to the secondary laboratory prior to reporting");
    }

    const timestampSec = Math.floor(Date.now() / 1000);
    const payloadHash = computeReportPayloadHash(
      req.sampleId,
      activeAccount,
      "Independent Retest Verification",
      reportHash,
      findings,
      1,
      timestampSec
    );
    const signature = generateSimulatedSignature(activeAccount, payloadHash);

    const retestReport = {
      sampleId: req.sampleId,
      laboratory: activeAccount,
      testType: "Independent Retest Verification",
      reportHash,
      findings,
      reportVersion: 1,
      timestamp: timestampSec,
      signature,
      uri: uri || "",
      isRetest: true,
      originalReportHash: req.originalReportHash,
    };

    const rec = {
      recType: 18, // RetestReported
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: reportHash,
      temp: -2147483648,
      note: `Independent Retest Submitted [${findings}]`,
      uri: uri || "",
      prevHash: s.headHash,
    };
    rec.recordHash = computeRecordHash(rec);

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [req.sampleId]: { ...s, headHash: rec.recordHash },
      },
      histories: {
        ...prev.histories,
        [req.sampleId]: [...(prev.histories[req.sampleId] || []), rec],
      },
      retestRequests: {
        ...prev.retestRequests,
        [requestId]: { ...req, completed: true, retestReportHash: reportHash },
      },
      attestedReports: {
        ...prev.attestedReports,
        [req.sampleId]: [...(prev.attestedReports?.[req.sampleId] || []), retestReport],
      },
    }));

    return { signature, payloadHash };
  };

  // -------------------------------------------------------------
  // FEATURE FOUR: DISCREPANCY MANAGEMENT & RESOLUTION
  // -------------------------------------------------------------
  const flagDiscrepancy = async ({ requestId, reason, evidenceHash, placeOnQuarantine = true }) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.flagDiscrepancy(requestId, reason, evidenceHash || ethers.ZeroHash, placeOnQuarantine);
      return await tx.wait();
    }

    // Sandbox execution
    const req = sandboxData.retestRequests?.[requestId];
    if (!req) throw new Error("Retest request not found");
    if (!req.completed) throw new Error("Retest report must be recorded before flagging discrepancy");

    // The original laboratory CANNOT flag or dismiss discrepancies to cover up issues
    if (activeAccount.toLowerCase() === req.originalLab.toLowerCase()) {
      throw new Error("Anti-tamper rule: The original laboratory cannot self-manage or intervene in disputes regarding its own results");
    }

    const s = sandboxData.samples[req.sampleId];
    const timestampSec = Math.floor(Date.now() / 1000);
    const caseId = ethers.keccak256(
      ethers.solidityPacked(["bytes32", "uint256"], [requestId, timestampSec])
    );

    const newCase = {
      caseId,
      sampleId: req.sampleId,
      requestId,
      originalReportHash: req.originalReportHash,
      retestReportHash: req.retestReportHash,
      originalLab: req.originalLab,
      retestLab: req.designatedLab,
      reason,
      evidenceHash: evidenceHash || ethers.ZeroHash,
      status: 0, // Open
      disposition: 0, // None
      resolutionReason: "",
      reviewer: ethers.ZeroAddress,
      flaggedAt: timestampSec,
      resolvedAt: 0,
    };

    let updatedHistory = [...(sandboxData.histories[req.sampleId] || [])];
    let newHead = s.headHash;

    const discRec = {
      recType: 19, // DiscrepancyFlagged
      actor: activeAccount,
      timestamp: timestampSec,
      dataHash: caseId,
      temp: -2147483648,
      note: `Discrepancy Investigation Opened: ${reason}`,
      uri: "",
      prevHash: newHead,
    };
    discRec.recordHash = computeRecordHash(discRec);
    updatedHistory.push(discRec);
    newHead = discRec.recordHash;

    let newStatus = s.status;
    if (placeOnQuarantine && s.status !== 3) {
      newStatus = 3; // Quarantined
      const qRec = {
        recType: 11, // Quarantined
        actor: activeAccount,
        timestamp: timestampSec + 1,
        dataHash: ethers.ZeroHash,
        temp: -2147483648,
        note: `Quarantined on hold pending resolution of discrepancy #${caseId.slice(0, 8)}`,
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
        [req.sampleId]: { ...s, status: newStatus, headHash: newHead },
      },
      histories: {
        ...prev.histories,
        [req.sampleId]: updatedHistory,
      },
      discrepancyCases: {
        ...prev.discrepancyCases,
        [caseId]: newCase,
      },
      sampleDiscrepancyCases: {
        ...prev.sampleDiscrepancyCases,
        [req.sampleId]: [...(prev.sampleDiscrepancyCases?.[req.sampleId] || []), caseId],
      },
      allDiscrepancyCaseIds: [caseId, ...(prev.allDiscrepancyCaseIds || [])],
    }));

    return { caseId };
  };

  const updateDiscrepancyStatus = async ({ caseId, status, note }) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.updateDiscrepancyStatus(caseId, status, note || "");
      return await tx.wait();
    }

    const c = sandboxData.discrepancyCases?.[caseId];
    if (!c) throw new Error("Discrepancy case not found");
    if (currentActor.orgType !== 5 && currentActor.orgType !== 0) {
      throw new Error("Unauthorized: Only compliance auditors can update discrepancy investigation status");
    }
    if (activeAccount.toLowerCase() === c.originalLab.toLowerCase()) {
      throw new Error("Anti-tamper protection: The original laboratory cannot self-manage this case");
    }

    setSandboxData((prev) => ({
      ...prev,
      discrepancyCases: {
        ...prev.discrepancyCases,
        [caseId]: { ...c, status },
      },
    }));
  };

  const resolveDiscrepancy = async ({
    caseId,
    disposition,
    resolutionReason,
    evidenceHash,
    releaseFromQuarantine = true
  }) => {
    if (mode === "web3") {
      if (!contract) throw new Error("Contract not connected");
      const tx = await contract.resolveDiscrepancy(
        caseId,
        disposition,
        resolutionReason,
        evidenceHash || ethers.ZeroHash,
        releaseFromQuarantine
      );
      return await tx.wait();
    }

    // Sandbox execution
    const c = sandboxData.discrepancyCases?.[caseId];
    if (!c) throw new Error("Discrepancy case not found");
    if (c.status === 2) throw new Error("Discrepancy is already resolved");

    // Strict Anti-Tamper Rule
    if (activeAccount.toLowerCase() === c.originalLab.toLowerCase()) {
      throw new Error("Self-resolution forbidden: An original laboratory cannot unilaterally resolve a discrepancy involving its own report");
    }
    if (currentActor.orgType !== 5 && currentActor.orgType !== 0) {
      throw new Error("Unauthorized: Only compliance auditors or network administrators can sign off on discrepancy resolutions");
    }

    const s = sandboxData.samples[c.sampleId];
    const timestampSec = Math.floor(Date.now() / 1000);

    let updatedHistory = [...(sandboxData.histories[c.sampleId] || [])];
    let newHead = s.headHash;

    let newStatus = s.status;
    if (releaseFromQuarantine && s.status === 3) {
      newStatus = 1; // Active
      const rRec = {
        recType: 12, // Released
        actor: activeAccount,
        timestamp: timestampSec,
        dataHash: ethers.ZeroHash,
        temp: -2147483648,
        note: `Released from quarantine hold after formal audit resolution: ${resolutionReason}`,
        uri: "",
        prevHash: newHead,
      };
      rRec.recordHash = computeRecordHash(rRec);
      updatedHistory.push(rRec);
      newHead = rRec.recordHash;
    }

    const resRec = {
      recType: 20, // DiscrepancyResolved
      actor: activeAccount,
      timestamp: timestampSec + 1,
      dataHash: caseId,
      temp: -2147483648,
      note: `Discrepancy Resolved: ${resolutionReason}`,
      uri: "",
      prevHash: newHead,
    };
    resRec.recordHash = computeRecordHash(resRec);
    updatedHistory.push(resRec);
    newHead = resRec.recordHash;

    setSandboxData((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [c.sampleId]: { ...s, status: newStatus, headHash: newHead },
      },
      histories: {
        ...prev.histories,
        [c.sampleId]: updatedHistory,
      },
      discrepancyCases: {
        ...prev.discrepancyCases,
        [caseId]: {
          ...c,
          status: 2, // Resolved
          disposition,
          resolutionReason,
          evidenceHash: evidenceHash || c.evidenceHash,
          reviewer: activeAccount,
          resolvedAt: timestampSec,
        },
      },
    }));
  };

  // -------------------------------------------------------------
  // AUDIT SELECTION POLICY (Auditable Random Selection Simulator)
  // -------------------------------------------------------------
  const auditSampleSelectionPolicy = ({ selectionSeed } = {}) => {
    const samples = Object.values(sandboxData.samples || {});
    // Eligible samples: Completed initial attested tests, not currently quarantined, active status
    const eligible = samples.filter((s) => {
      const reports = sandboxData.attestedReports?.[s.sampleId] || [];
      return reports.length > 0 && s.status === 1;
    });

    if (eligible.length === 0) {
      return { eligible: [], selected: null, reason: "No eligible completed tests found for secondary verification." };
    }

    // Demonstrable selection logic with auditable trace
    const entropy = selectionSeed || ethers.hexlify(ethers.randomBytes(16));
    const numericSeed = BigInt(ethers.keccak256(ethers.toUtf8Bytes(entropy))) % BigInt(eligible.length);
    const selected = eligible[Number(numericSeed)];

    return {
      eligible: eligible.map((s) => ({
        sampleId: s.sampleId,
        blindId: s.blindId || "UNBLINDED",
        sampleType: s.sampleType,
        custodian: s.custodian
      })),
      selected,
      selectionSeed: entropy,
      timestamp: Date.now(),
      policy: "ISO-15189 Cross-Laboratory Blind Proficiency Verification (10% Sample Cohort Sampling)",
      disclaimer: "PROTOTYPE DEMONSTRATION NOTICE: In a production clinical deployment, randomness must be sourced from an auditable cryptographic oracle (e.g. Chainlink VRF) to eliminate operator selection bias."
    };
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
        // Core Lifecycle Methods
        registerSample,
        createAliquot,
        initiateTransfer,
        acceptTransfer,
        rejectTransfer,
        logStorage,
        logHandling,
        logIncident,
        quarantine,
        release,
        tamperRecord,
        registerOrg,
        // Verification & Discrepancy Methods
        recordAttestedTest,
        requestIndependentRetest,
        recordRetestReport,
        flagDiscrepancy,
        updateDiscrepancyStatus,
        resolveDiscrepancy,
        auditSampleSelectionPolicy,
        // Privacy & Identity Helpers
        resolveIdentity,
        lookupBlindId,
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
