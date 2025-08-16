require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");
const fs = require("fs");

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
const wallet = new ethers.Wallet(process.env.PARTY_A_PRIVATE_KEY, provider);

// Contract ABI and Bytecode
const contractJson = require("../artifacts/contracts/BidirectionalPaymentChannel.sol/BidirectionalPaymentChannel.json");
const abi = contractJson.abi;
const bytecode = contractJson.bytecode;

// Read values from .env
const partyB = process.env.PARTY_B_ADDRESS;
const duration = 3600; // 1 hour timeout (adjust as needed)

(async () => {
  // Deploy the contract
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(partyB, duration, {
    value: 0,  // No funding at deployment; it will be done later in sign.js
  });
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed at:", contractAddress);

  // Save deployment info to file
  const deploymentInfo = {
    network: "ganache",  // Change according to your network
    contractAddress,
    partyB,
    timestamp: Date.now(),
  };

  fs.writeFileSync(
    `./storage/deployment-bidirectional-${"ganache"}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
})();
