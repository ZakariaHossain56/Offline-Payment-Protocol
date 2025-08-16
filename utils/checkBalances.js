require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
  const privateKey = process.env.PRIVATE_KEY; // Payer's private key
  const wallet = new ethers.Wallet(privateKey, provider);

  const payerAddress = wallet.address; // Derive the address from the private key
  const receiverAddress = process.env.RECEIVER_ADDRESS; // Receiver's address

  console.log("Payer Address:", payerAddress);

  const balanceFrom = await provider.getBalance(payerAddress);
  const balanceTo = await provider.getBalance(receiverAddress);

  console.log("Payer Balance:", ethers.formatEther(balanceFrom), "ETH");
  console.log("Receiver Balance:", ethers.formatEther(balanceTo), "ETH");
}

main();
