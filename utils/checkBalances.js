require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");

  // Party A
  const walletA = new ethers.Wallet(process.env.PARTY_A_PRIVATE_KEY, provider);
  const balanceA = await provider.getBalance(walletA.address);

  // Party B
  const walletB = new ethers.Wallet(process.env.PARTY_B_PRIVATE_KEY, provider);
  const balanceB = await provider.getBalance(walletB.address);

  console.log("Party A Address:", walletA.address);
  console.log("Party A Balance:", ethers.formatEther(balanceA), "ETH");

  console.log("Party B Address:", walletB.address);
  console.log("Party B Balance:", ethers.formatEther(balanceB), "ETH");
}

main().catch((err) => {
  console.error("Error:", err);
});
