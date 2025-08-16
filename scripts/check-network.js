const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Modern way to get and format balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("✅ Deployer address:", deployer.address);
    console.log("💰 Balance (ETH):", ethers.formatEther(balance));  // Note: No .utils
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });