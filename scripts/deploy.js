

const { ethers } = require("hardhat");
const fs = require("fs");
const hre = require("hardhat");

async function main() {
  // Get the deployer/signer
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contract with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  console.log("Deploying OfflinePayment contract...");
  const OfflinePayment = await ethers.getContractFactory("OfflinePayment");
  const offlinePayment = await OfflinePayment.deploy();
  
  // Wait for deployment to complete
  // Get the address - PROPER WAY
  const contractAddress = await offlinePayment.getAddress();
  console.log("✅ OfflinePayment deployed to:", contractAddress);

  // Save deployment info to a fedile
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: Date.now()
  };

  fs.writeFileSync(
    `./storage/deployment-${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });