const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config({ path: "../.env" });

async function settleBalances() {
  try {
    // 1. Setup provider and wallets
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    const walletA = new ethers.Wallet(process.env.PARTY_A_PRIVATE_KEY, provider);
    const walletB = new ethers.Wallet(process.env.PARTY_B_PRIVATE_KEY, provider);

    // 2. Load contract
    const deploymentData = JSON.parse(fs.readFileSync("../storage/deployment-bidirectional-ganache.json"));
    const contractAddress = deploymentData.contractAddress;
    const abi = require("../artifacts/contracts/BidirectionalPaymentChannel.sol/BidirectionalPaymentChannel.json").abi;
    const contract = new ethers.Contract(contractAddress, abi, walletA);

    // 3. Read signed state
    const payload = JSON.parse(fs.readFileSync("../storage/signedPayment.json"));
    console.log("📄 Loaded signed state:");
    console.log(`- Party A Balance: ${ethers.formatEther(payload.balanceA)} ETH`);
    console.log(`- Party B Balance: ${ethers.formatEther(payload.balanceB)} ETH`);
    console.log(`- Nonce: ${payload.nonce}`);

    // 4. Verify the state hash matches signatures
    const stateHash = ethers.solidityPackedKeccak256(
      ["uint256", "uint256", "uint256", "address"],
      [payload.balanceA, payload.balanceB, payload.nonce, contractAddress]
    );

    const recoveredA = ethers.verifyMessage(ethers.getBytes(stateHash), payload.sigA);
    const recoveredB = ethers.verifyMessage(ethers.getBytes(stateHash), payload.sigB);

    console.log("\n🔍 Signature Verification:");
    console.log(`- Recovered Party A: ${recoveredA} (matches ${walletA.address}? ${recoveredA === walletA.address})`);
    console.log(`- Recovered Party B: ${recoveredB} (matches ${walletB.address}? ${recoveredB === walletB.address})`);

    if (recoveredA !== walletA.address || recoveredB !== walletB.address) {
      throw new Error("❌ Invalid signatures! Cannot settle balances.");
    }

    // 5. Submit to contract
    console.log("\n🔄 Submitting to contract...");
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

    // 6. Verify balances were updated
    const newBalanceA = await provider.getBalance(walletA.address);
    const newBalanceB = await provider.getBalance(walletB.address);
    console.log("\n💰 Final Balances:");
    console.log(`- Party A: ${ethers.formatEther(newBalanceA)} ETH`);
    console.log(`- Party B: ${ethers.formatEther(newBalanceB)} ETH`);
  } catch (error) {
    console.error("❌ Settlement failed:", error);
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
    process.exit(1);
  }
}

settleBalances();