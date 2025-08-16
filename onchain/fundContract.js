require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");

async function fundContract() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const contractAddress = require("./storage/deployment-ganache.json").contractAddress;

  // Check the current contract balance
  const contractBalance = await provider.getBalance(contractAddress);
  const contractBalanceInEther = ethers.formatEther(contractBalance);
  console.log(`🔍 Current contract balance: ${contractBalanceInEther} ETH`);

  // If the contract balance is less than a certain threshold (e.g., 1 ETH), fund it
  const requiredBalance = ethers.parseEther("1.0"); // Example threshold, adjust as necessary
  if (contractBalance < requiredBalance) {  // Changed from .lt() to direct comparison
    console.log(`⚠️ Contract balance is less than required. Funding the contract...`);

    const fundAmount = ethers.parseEther("10"); // Fund the contract with 10 ETH

    // Send 10 ETH to the contract address
    const tx = await wallet.sendTransaction({
      to: contractAddress,
      value: fundAmount
    });

    await tx.wait();
    console.log(`✅ Contract funded with 10 ETH. Tx hash: ${tx.hash}`);
  } else {
    console.log(`✅ Contract already has sufficient funds.`);
  }
}

fundContract().catch(console.error);