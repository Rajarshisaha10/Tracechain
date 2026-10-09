# 🧬 Tracechain — Biological Specimen Provenance & Chain of Custody

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow?logo=ethereum)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Contract%20Tests-15%20Passing-10b981)](https://hardhat.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Tracechain** is an enterprise-grade, decentralized chain of custody and cryptographic provenance registry engineered for biological specimens, bio-banks, clinical research trials, and diagnostic laboratories.

---

## 🌟 Key Architecture & Pillars

```
+---------------------------------------------------------------------------------------------------+
|                                      TRACECHAIN ARCHITECTURE                                      |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ CLINICAL LEVEL ]                                                                               |
|    +----------------------+       +-----------------------+       +------------------------+      |
|    |  Hospital Collection | ----> |  Logistics Courier    | ----> |  Genomics Diagnostic   |      |
|    |  (Sample Registered) |       |  (Cold-Chain Transit) |       |  (DNA/RNA Sequencing)  |      |
|    +----------------------+       +-----------------------+       +------------------------+      |
|                |                              |                               |                   |
|  [ CRYPTOGRAPHIC LEVEL ]                      |                               |                   |
|                v                              v                               v                   |
|        Record 0 (Root)               Record 1 (Storage)              Record 2 (Transfer)          |
|    [ keccak256(anchor) ] <------- [ prevHash: R0 ] <------------- [ prevHash: R1 ]               |
|                                                                               |                   |
|                                                                               v                   |
|                                                                    [ headHash: Tip Hash ]         |
|                                                                                                   |
|  [ CONSENSUS LEVEL: SampleChain.sol on EVM ]                                                      |
|    - Mathematical Tamper Verification: verifyChain(sampleId) recomputes whole hash chain          |
|    - Two-Step Custody: Initiate -> Accept / Reject                                                |
|    - Automated Quarantine: Receipts marked damaged or out-of-spec are automatically locked        |
|    - Privacy First: Informed consent documents & subject IDs are zero-knowledge hashed           |
+---------------------------------------------------------------------------------------------------+
```

### 1. Cryptographic Hash-Chain Provenance
Every physical handling event is permanently appended to a per-sample hash chain anchored at the unique `sampleId`:
$$\text{RecordHash} = \text{keccak256}(\text{prevHash}, \text{recType}, \text{actor}, \text{timestamp}, \text{dataHash}, \text{temp}, \text{keccak256}(\text{note}), \text{keccak256}(\text{uri}))$$
Any unauthorized modification immediately breaks the cryptographic tip `headHash`, proving non-repudiation.

### 2. Two-Step Custody & Automated Quarantine
Custody handoffs require atomic sender dispatch and recipient acceptance. Recipients explicitly certify physical integrity on arrival. Compromised, thawed, or unsealed shipments are automatically placed under quarantine on-chain.

### 3. Sub-Sample Lineage (Aliquot Trees)
Split whole blood into plasma, serum, buffy coat, or DNA/RNA fractions while preserving bi-directional cryptographic parent-child links.

### 4. Zero-Knowledge Privacy Architecture
Never exposes Protected Health Information (PHI) or personal patient data on-chain. Informed consent forms, sequencing reports, and pseudonymous subject identifiers are hashed client-side before submission.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 1. Installation
Clone repository and install dependencies:
```bash
git clone https://github.com/Rajarshisaha10/Tracechain.git
cd Tracechain
npm install
```

### 2. Compile Smart Contracts
Compile the contracts with Hardhat:
```bash
npm run compile
```

### 3. Run Automated Contract Test Suite
Execute the full test suite (15 automated test cases):
```bash
npm run test:contracts
```

Output:
```
  SampleChain - Biological Specimen Chain of Custody
    Governance & Organization Onboarding
      √ should set deployer as admin
      √ should allow admin to register new organization
      √ should revert if non-admin tries to register org
      √ should prevent duplicate organization registration
      √ should toggle org active status
      √ should handle emergency pause and unpause
    Sample Lifecycle & Hash Chain Provenance
      √ should register sample with verified initial hash chain
      √ should log cryogenic storage with temperature
      √ should split into an aliquot (child sample)
      √ should record diagnostic test with report hash
    Custody Handoffs & Quarantine Behavior
      √ should complete two-step transfer when recipient accepts intact
      √ should AUTOMATICALLY QUARANTINE sample if recipient marks damaged on arrival
      √ should allow auditor to release quarantined sample
      √ should allow batch custody transfer
      √ should provide system statistics and paginated queries

  15 passing (3s)
```

### 4. Launch React Application
Start the local Vite dev server:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🖥️ React DApp Features

The frontend offers a dual-mode experience:

1. **Interactive Sandbox Simulation (Zero-Friction Demo)**:
   - Pre-loaded with clinical trial specimens (Whole Blood, Oncology Biopsy, Plasma Aliquots, RNA Extract).
   - Instant role switcher: switch active actor between **Hospital**, **Diagnostic Laboratory**, **Cold-Chain Courier**, **Compliance Auditor**, and **Network Admin** with a single click.
   - Built-in **"Verify Hash Chain"** tool and **"Simulate Tamper Attack"** educational demonstration.
   - Cryo-vial QR Code / Barcode generator with 1-click printing.

2. **Live Web3 Wallet Integration**:
   - Connect MetaMask, Rabby, or any EIP-1193 browser wallet.
   - Deploys signed transactions directly to local Hardhat nodes, Ethereum Sepolia, or Polygon Amoy.

---

## 📦 Deployment to Blockchain Networks

### Deploy to Local Hardhat Node
1. Start local EVM node:
```bash
npx hardhat node
```
2. In a separate terminal, deploy and seed:
```bash
npm run deploy:local
```

### Deploy to Ethereum Sepolia Testnet
1. Create a `.env` file (or set environment variables):
```env
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
```
2. Deploy contract:
```bash
npm run deploy:sepolia
```
The deploy script automatically generates:
- `src/contracts/contractAddress.js`
- `src/contracts/SampleChainABI.json`

---

## 📁 Repository Structure

```
Tracechain/
├── contracts/
│   └── SampleChain.sol       # Enhanced Solidity 0.8.20 Smart Contract
├── scripts/
│   └── deploy.js             # Hardhat deployment, org registration & seed script
├── test/
│   └── SampleChain.test.js   # Automated unit & integration tests
├── src/
│   ├── components/
│   │   ├── Navbar.jsx               # Header, tab navigation & role switcher
│   │   ├── Dashboard.jsx            # KPI telemetry, cold-chain radar & live stream
│   │   ├── SampleExplorer.jsx       # Search & specimen inventory grid
│   │   ├── SampleDetailModal.jsx    # Deep passport & interactive hash chain inspector
│   │   ├── RegisterSampleModal.jsx  # Client-side hashing & specimen registration
│   │   ├── CustodyTransfers.jsx     # Two-step handoffs & arrival condition checklist
│   │   ├── AliquotManager.jsx       # Aliquot tree visualizer & fractionation wizard
│   │   ├── AuditCompliance.jsx      # Lab test recording, incidents & quarantine release
│   │   ├── OrgDirectory.jsx         # Network participant directory & admin onboarding
│   │   ├── StorageLogModal.jsx      # Temperature telemetry logger (-80°C, -20°C, 4°C)
│   │   ├── TransferModal.jsx        # Direct dispatch modal
│   │   └── BarcodeModal.jsx         # Scannable cryo-vial QR label generator
│   ├── context/
│   │   └── ChainContext.jsx         # State machine for Web3 & Sandbox simulation
│   ├── contracts/
│   │   ├── SampleChainABI.json      # Exported ABI
│   │   └── contractAddress.js       # Deployed contract address configuration
│   ├── utils/
│   │   ├── crypto.js                # Keccak-256, file hashing & chain verification
│   │   ├── formatters.js            # Address, temperature, and timestamp helpers
│   │   └── mockData.js              # Rich clinical trials demo dataset
│   ├── App.jsx                      # Main React application shell
│   ├── index.css                    # Dark biotech theme & glassmorphic styling
│   └── main.jsx                     # Vite entry point
├── hardhat.config.js         # Hardhat network & compiler configuration
├── vite.config.js            # Vite configuration
├── package.json              # Project scripts & dependencies
└── README.md                 # Complete documentation
```

---

## 📜 Compliance Standards Alignment

- **ISO 20387**: General requirements for bio-banking (chain of custody, non-conformance logging, traceability).
- **21 CFR Part 11**: Electronic records, non-repudiation, audit trails, and data integrity.
- **Good Clinical Practice (GCP)**: Specimen provenance and informed consent tracking.

---

## ⚖️ License
This project is open-source under the [MIT License](LICENSE).
