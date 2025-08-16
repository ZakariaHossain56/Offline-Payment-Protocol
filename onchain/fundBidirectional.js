require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");
const fs = require("fs");

async function fundContract() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");

  // Load private keys from .env
  const partyA = new ethers.Wallet(process.env.PARTY_A_PRIVATE_KEY, provider);
  const partyB = new ethers.Wallet(process.env.PARTY_B_PRIVATE_KEY, provider);

  const contractAddress = require("../storage/deployment-bidirectional-ganache.json").contractAddress;

  // Check current contract balance
  const initialBalance = await provider.getBalance(contractAddress);
  console.log(`🔍 Current contract balance: ${ethers.formatEther(initialBalance)} ETH`);

  // Fund amounts from .env
  const fundAmountA = ethers.parseEther(process.env.PARTY_A_SEND);
  const fundAmountB = ethers.parseEther(process.env.PARTY_B_SEND);

  const fundingLogs = [];

  // Party A funds
  console.log(`⚡ Party A funding contract with ${process.env.PARTY_A_SEND} ETH...`);
  const txA = await partyA.sendTransaction({
    to: contractAddress,
    value: fundAmountA
  });
  await txA.wait();

  fundingLogs.push({
    contractAddress,
    funder: partyA.address,
    amountFunded: process.env.PARTY_A_SEND + " ETH",
    txHash: txA.hash,
    timestamp: new Date().toISOString()
  });

  console.log(`✅ Party A funded. Tx hash: ${txA.hash}`);

  // Party B funds
  console.log(`⚡ Party B funding contract with ${process.env.PARTY_B_SEND} ETH...`);
  const txB = await partyB.sendTransaction({
    to: contractAddress,
    value: fundAmountB
  });
  await txB.wait();

  fundingLogs.push({
    contractAddress,
    funder: partyB.address,
    amountFunded: process.env.PARTY_B_SEND + " ETH",
    txHash: txB.hash,
    timestamp: new Date().toISOString()
  });

  console.log(`✅ Party B funded. Tx hash: ${txB.hash}`);

  // Save funding details
  const finalBalance = await provider.getBalance(contractAddress);

  const details = {
    contractAddress,
    initialBalance: ethers.formatEther(initialBalance) + " ETH",
    finalBalance: ethers.formatEther(finalBalance) + " ETH",
    fundings: fundingLogs
  };

  fs.writeFileSync("./storage/fundingDetails.json", JSON.stringify(details, null, 2));
  console.log("📝 Funding details saved to storage/fundingDetails.json");


  //Initialize signedPayment.json with new balances
  const nonce = 0;
  const state = {
            balanceA: fundAmountA.toString(),
            balanceB: fundAmountB.toString(),
            nonce,
            sigA: txA.hash,
            sigB: txB.hash
          };
  fs.writeFileSync("./storage/signedPayment.json", JSON.stringify(state, null, 2));
  console.log("📝 Initializing fundings details to storage/signedPayment.json");
}

fundContract().catch(console.error);
