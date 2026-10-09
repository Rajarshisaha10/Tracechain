const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("--------------------------------------------------");
  console.log("🚀 Deploying Tracechain Smart Contract Infrastructure");
  console.log("--------------------------------------------------");

  const [deployer, hospital, lab, research, courier, auditor] = await hre.ethers.getSigners();
  console.log("Deployer / Network Admin account:", deployer.address);

  // Deploy SampleChain contract
  const SampleChain = await hre.ethers.getContractFactory("SampleChain");
  const contract = await SampleChain.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log("✅ SampleChain contract deployed to:", contractAddress);

  // Register realistic demo organizations if multiple signers exist (e.g. hardhat or local network)
  if (hospital && lab && courier && auditor) {
    console.log("\n🏢 Registering network organizations...");

    // OrgTypes: Hospital = 1, Laboratory = 2, Research = 3, Courier = 4, Auditor = 5
    const zeroAccreditation = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("ISO-15189-ACCREDITED"));

    await contract.registerOrg(
      hospital.address,
      "Memorial Sloan Bio-Center",
      1, // Hospital
      hre.ethers.encodeBytes32String("US").slice(0, 6),
      zeroAccreditation
    );
    console.log("  ✓ Registered Hospital:", hospital.address, "(Memorial Sloan Bio-Center)");

    await contract.registerOrg(
      lab.address,
      "Apex Genomics Core Lab",
      2, // Laboratory
      hre.ethers.encodeBytes32String("CH").slice(0, 6),
      zeroAccreditation
    );
    console.log("  ✓ Registered Laboratory:", lab.address, "(Apex Genomics Core Lab)");

    if (research) {
      await contract.registerOrg(
        research.address,
        "BioDiscovery Advanced Oncology Institute",
        3, // Research
        hre.ethers.encodeBytes32String("GB").slice(0, 6),
        zeroAccreditation
      );
      console.log("  ✓ Registered Research Org:", research.address);
    }

    await contract.registerOrg(
      courier.address,
      "CryoTransit Logistics Cold-Chain",
      4, // Courier
      hre.ethers.encodeBytes32String("DE").slice(0, 6),
      zeroAccreditation
    );
    console.log("  ✓ Registered Courier:", courier.address, "(CryoTransit Logistics)");

    await contract.registerOrg(
      auditor.address,
      "International BioEthics Compliance Auditor",
      5, // Auditor
      hre.ethers.encodeBytes32String("CH").slice(0, 6),
      zeroAccreditation
    );
    console.log("  ✓ Registered Auditor:", auditor.address, "(BioEthics Compliance)");

    // Seed initial demo sample from hospital
    console.log("\n🧪 Seeding sample data...");
    const contractAsHospital = contract.connect(hospital);
    const now = Math.floor(Date.now() / 1000);
    const consentHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("CONSENT_FORM_SIGNED_SUBJECT_2026_09"));
    const subjectHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("SUBJECT_ANON_ID_P90812"));

    const regTx = await contractAsHospital.registerSample({
      externalId: "MSBC-2026-WB-001",
      sampleType: "Whole Blood (EDTA)",
      collectedAt: now - 3600,
      consentHash: consentHash,
      subjectHash: subjectHash,
      note: "Collected in Ward 4B Oncology. Initial volume: 10 mL."
    });
    const receipt = await regTx.wait();
    const sampleId = await contract.computeSampleId(hospital.address, "MSBC-2026-WB-001");
    console.log("  ✓ Registered initial sample ID:", sampleId);

    // Hospital logs cryogenic storage
    await contractAsHospital.logStorage(sampleId, "CryoFreezer Bay 3, Shelf B", -800, "Stored at -80.0°C in liquid nitrogen backup unit");
    console.log("  ✓ Logged initial cryogenic storage (-80.0°C)");

    // Hospital initiates transfer to Courier
    await contractAsHospital.initiateTransfer(sampleId, courier.address, "AirWayBill #AWB-99201. Transport in dry ice shipper box.");
    console.log("  ✓ Initiated transfer to Courier:", courier.address);

    // Courier accepts transfer (intact)
    const contractAsCourier = contract.connect(courier);
    await contractAsCourier.acceptTransfer(sampleId, true, "Seal verified intact, data logger reads -78.4°C");
    console.log("  ✓ Courier accepted delivery intact");

    // Verify hash chain validity
    const verified = await contract.verifyChain(sampleId);
    console.log("  ✓ Cryptographic hash chain verified on-chain:", verified ? "VALID (Tamper-evident proof intact)" : "INVALID");
  }

  // Export contract artifacts for React frontend
  const outDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "SampleChain.sol", "SampleChain.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(path.join(outDir, "SampleChainABI.json"), JSON.stringify(artifact.abi, null, 2));
    console.log("  ✓ Exported SampleChainABI.json to frontend");
  }

  const addressConfig = `// Auto-generated by Hardhat deploy script
export const SAMPLE_CHAIN_ADDRESS = "${contractAddress}";
export const NETWORK_CHAIN_ID = ${hre.network.config.chainId || 31337};
`;
  fs.writeFileSync(path.join(outDir, "contractAddress.js"), addressConfig);
  console.log("  ✓ Exported contractAddress.js to frontend");

  console.log("\n🎉 Deployment and setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
