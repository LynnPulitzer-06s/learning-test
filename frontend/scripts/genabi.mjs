import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "LearningTest";

// <root>/backend
const rel = "../backend";

// <root>/frontend/abi
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/backend${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

// Network name to chainId and chainName mapping
// Based on hardhat.config.ts and common network configurations
const networkConfig = {
  hardhat: { chainId: 31337, chainName: "hardhat" },
  localhost: { chainId: 31337, chainName: "hardhat" },
  anvil: { chainId: 31337, chainName: "anvil" },
  sepolia: { chainId: 11155111, chainName: "sepolia" },
  mainnet: { chainId: 1, chainName: "mainnet" },
  goerli: { chainId: 5, chainName: "goerli" },
  // Add more networks as needed
};

/**
 * Get network configuration from network name
 * If not found in mapping, try to infer from common patterns
 */
function getNetworkConfig(networkName) {
  // Check if we have a direct mapping
  if (networkConfig[networkName]) {
    return networkConfig[networkName];
  }

  // Try to infer from name (e.g., "sepolia" -> sepolia config)
  const lowerName = networkName.toLowerCase();
  if (networkConfig[lowerName]) {
    return networkConfig[lowerName];
  }

  // Default: use network name as chainName and try to get chainId from deployment
  // For unknown networks, we'll use the network name as chainName
  // and set chainId to 0 (will need to be updated manually or from deployment file)
  return { chainId: 0, chainName: networkName };
}

/**
 * Read deployment file for a specific network
 * Returns undefined if deployment doesn't exist
 */
function readDeployment(networkName, contractName) {
  const chainDeploymentDir = path.join(deploymentsDir, networkName);
  const contractFile = path.join(chainDeploymentDir, `${contractName}.json`);

  if (!fs.existsSync(chainDeploymentDir)) {
    return undefined;
  }

  if (!fs.existsSync(contractFile)) {
    return undefined;
  }

  try {
    const jsonString = fs.readFileSync(contractFile, "utf-8");
    const obj = JSON.parse(jsonString);
    const config = getNetworkConfig(networkName);
    
    obj.chainId = config.chainId;
    obj.chainName = config.chainName;
    obj.networkName = networkName;

    return obj;
  } catch (error) {
    console.warn(`⚠ Failed to read deployment for ${networkName}: ${error.message}`);
    return undefined;
  }
}

/**
 * Scan deployments directory and find all deployed networks
 */
function scanDeployments() {
  if (!fs.existsSync(deploymentsDir)) {
    console.warn(`⚠ Deployments directory not found: ${deploymentsDir}`);
    return [];
  }

  const deployments = [];
  const entries = fs.readdirSync(deploymentsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const networkName = entry.name;
    const deployment = readDeployment(networkName, CONTRACT_NAME);

    if (deployment) {
      deployments.push(deployment);
      console.log(`✓ Found deployment on ${networkName}: ${deployment.address} (chainId: ${deployment.chainId})`);
    }
  }

  return deployments;
}

// Scan all deployments
const allDeployments = scanDeployments();

if (allDeployments.length === 0) {
  console.warn(`${line}No deployments found for ${CONTRACT_NAME}.\n\nTo deploy:\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network <networkName>'.${line}`);
  console.warn("⚠ Generating empty ABI and addresses files...");
  
  // Generate empty files
  const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
  WARNING: No deployments found. Please deploy the contract first.
*/
export const ${CONTRACT_NAME}ABI = { abi: [] } as const;
`;

  const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
  WARNING: No deployments found. Please deploy the contract first.
*/
export const ${CONTRACT_NAME}Addresses = {};
`;

  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(
    path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
    tsAddresses,
    "utf-8"
  );

  console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
  console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
  process.exit(0);
}

// Validate ABI consistency across all deployments
const firstDeployment = allDeployments[0];
const firstABI = JSON.stringify(firstDeployment.abi);

for (let i = 1; i < allDeployments.length; i++) {
  const currentABI = JSON.stringify(allDeployments[i].abi);
  if (currentABI !== firstABI) {
    console.error(
      `${line}ABI mismatch detected between deployments!\n\n` +
      `Deployment on ${firstDeployment.networkName} differs from ${allDeployments[i].networkName}.\n` +
      `Please re-deploy contracts to ensure ABI consistency.${line}`
    );
    process.exit(1);
  }
}

// Generate ABI file (use ABI from first deployment)
const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: firstDeployment.abi }, null, 2)} as const;
`;

// Generate addresses file - include all deployed networks
const addressesEntries = allDeployments.map((deployment) => {
  return `  "${deployment.chainId}": { address: "${deployment.address}", chainId: ${deployment.chainId}, chainName: "${deployment.chainName}" }`;
});

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
${addressesEntries.join(",\n")}
};
`;

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);

console.log(`\n✅ Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`✅ Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(`\n📊 Summary: Found ${allDeployments.length} deployment(s) across ${allDeployments.map(d => d.networkName).join(", ")}`);

