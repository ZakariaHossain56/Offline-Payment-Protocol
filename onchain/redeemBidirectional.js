



require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");
const fs = require("fs");

// Setup provider and wallet (Party A is fine since both signatures are required anyway)
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
const walletA = new ethers.Wallet(process.env.PARTY_A_PRIVATE_KEY, provider);

// Load contract
const deploymentData = JSON.parse(fs.readFileSync("./storage/deployment-bidirectional-ganache.json"));
const contractAddress = deploymentData.contractAddress;
const abi = require("../artifacts/contracts/BidirectionalPaymentChannel.sol/BidirectionalPaymentChannel.json").abi;
const contract = new ethers.Contract(contractAddress, abi, walletA);

async function updateBalances() {
  const currentBalanceA = await provider.getBalance(walletA.address);
  console.log(`💵 Party A: ${ethers.formatEther(currentBalanceA)} ETH`);
  
  // If you also want Party B's balance
  const walletB = new ethers.Wallet(process.env.PARTY_B_PRIVATE_KEY, provider);
  const currentBalanceB = await provider.getBalance(walletB.address);
  console.log(`💵 Party B: ${ethers.formatEther(currentBalanceB)} ETH`);
}

async function finalizeChannel() {
  try {
    // Read signed state from file
    const payload = JSON.parse(fs.readFileSync("./storage/signedPayment.json"));
    console.log("📄 Using signed state with nonce:", payload.nonce);

    // Verify signatures locally
    const stateHash = ethers.solidityPackedKeccak256(
      ["uint256", "uint256", "uint256", "address"],
      [payload.balanceA, payload.balanceB, payload.nonce, contractAddress]
    );

    const recoveredA = ethers.verifyMessage(ethers.getBytes(stateHash), payload.sigA);
    const recoveredB = ethers.verifyMessage(ethers.getBytes(stateHash), payload.sigB);

    if (recoveredA !== process.env.PARTY_A_ADDRESS || recoveredB !== process.env.PARTY_B_ADDRESS) {
      throw new Error("❌ Invalid signatures! Refusing to finalize.");
    }

    // Submit to contract
    console.log("🔄 Submitting final state to contract...");
    const tx = await contract.submitFinalState(
      payload.balanceA,
      payload.balanceB,
      payload.nonce,
      payload.sigA,
      payload.sigB,
      { gasLimit: 1000000 }
    );

    console.log(`⏳ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction mined in block ${receipt.blockNumber}`);

    await updateBalances();
  } catch (err) {
    console.error("❌ Finalization failed:", err.message);
    if (err.reason) console.error("Revert reason:", err.reason);
  }
}

finalizeChannel().catch((err) => {
  console.error("❌ Script error:", err);
  process.exit(1);
});
