require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");
const fs = require("fs");

async function fundContract() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");

  // Load private keys from .env
  const partyA = new ethers.Wallet(process.env.PARTY_A_PRIVATE_KEY, provider);
  const partyB = new ethers.Wallet(process.env.PARTY_B_PRIVATE_KEY, provider);

  const contractAddress = require("../storage/deployment-bidirectional-ganache.json").contractAddress;
  // Load signed state
  const signedState = JSON.parse(fs.readFileSync("./storage/signedPayment.json"));

  // Check current contract balance
  const initialBalance = await provider.getBalance(contractAddress);

  // Convert string balances to BigInt
  let balanceA = BigInt(signedState.balanceA);
  let balanceB = BigInt(signedState.balanceB);

  // Extract balances from signed state
  //balanceA = ethers.formatEther(balanceA);
  //balanceB = ethers.formatEther(balanceB);

  console.log(`🔍 Current contract balance: ${ethers.formatEther(initialBalance)} ETH`);
  console.log(`- Party A (${partyA.address}): ${ethers.formatEther(balanceA)} ETH`);
  console.log(`- Party B (${partyB.address}): ${ethers.formatEther(balanceB)} ETH`);
}

fundContract().catch((err) => {
  console.error("Error:", err);
});