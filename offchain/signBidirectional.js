// require("dotenv").config({ path: "../.env" });
// const { ethers } = require("ethers");
// const fs = require("fs");
// const readline = require("readline");

// // Setup provider and wallets
// const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
// const walletA = new ethers.Wallet(process.env.PARTY_A_PRIVATE_KEY, provider);
// const walletB = new ethers.Wallet(process.env.PARTY_B_PRIVATE_KEY, provider);

// // Load contract
// const deploymentData = JSON.parse(fs.readFileSync("./storage/deployment-bidirectional-ganache.json"));
// const contractAddress = deploymentData.contractAddress;
// const abi = require("../artifacts/contracts/BidirectionalPaymentChannel.sol/BidirectionalPaymentChannel.json").abi;
// const contract = new ethers.Contract(contractAddress, abi, walletA);

// // Setup initial balances
// let balanceA = ethers.parseEther(process.env.PARTY_A_SEND);
// let balanceB = ethers.parseEther(process.env.PARTY_B_SEND);
// let nonce = 0;

// // Setup readline
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// function ask(question) {
//   return new Promise((resolve) => rl.question(question, resolve));
// }

// // async function fundChannels() {
// //   console.log("🔄 Funding contract from Party A and Party B...");

// //   const txA = await walletA.sendTransaction({
// //     to: contractAddress,
// //     value: balanceA
// //   });
// //   await txA.wait();
// //   console.log(`✅ Party A funded. Tx: ${txA.hash}`);

// //   const txB = await walletB.sendTransaction({
// //     to: contractAddress,
// //     value: balanceB
// //   });
// //   await txB.wait();
// //   console.log(`✅ Party B funded. Tx: ${txB.hash}`);
// // }

// async function updateBalances() {
//   const currentBalanceA = await provider.getBalance(walletA.address);
//   const currentBalanceB = await provider.getBalance(walletB.address);

//   console.log("\n💵 Current On-Chain Balances:");
//   console.log(`- Party A: ${ethers.formatEther(currentBalanceA)} ETH`);
//   console.log(`- Party B: ${ethers.formatEther(currentBalanceB)} ETH`);
// }

// async function finalizeChannel() {
//   try {
//     // Read the signed state
//     const payload = JSON.parse(fs.readFileSync("./storage/signedPayment.json"));
//     console.log("📄 Using signed state with nonce:", payload.nonce);

//     // Verify signatures
//     const stateHash = ethers.solidityPackedKeccak256(
//       ["uint256", "uint256", "uint256", "address"],
//       [payload.balanceA, payload.balanceB, payload.nonce, contractAddress]
//     );

//     const recoveredA = ethers.verifyMessage(ethers.getBytes(stateHash), payload.sigA);
//     const recoveredB = ethers.verifyMessage(ethers.getBytes(stateHash), payload.sigB);

//     if (recoveredA !== walletA.address || recoveredB !== walletB.address) {
//       throw new Error("Invalid signatures!");
//     }

//     console.log("🔄 Submitting final state to contract...");
//     const tx = await contract.submitFinalState(
//       payload.balanceA,
//       payload.balanceB,
//       payload.nonce,
//       payload.sigA,
//       payload.sigB,
//       { gasLimit: 1000000 }
//     );

//     console.log(`⏳ Transaction sent: ${tx.hash}`);
//     const receipt = await tx.wait();
//     console.log(`✅ Transaction mined in block ${receipt.blockNumber}`);

//     // Show final balances
//     await updateBalances();
//   } catch (err) {
//     console.error("❌ Finalization failed:", err.message);
//     if (err.reason) console.error("Revert reason:", err.reason);
    
//     // Show current channel status if available
//     try {
//       const isClosed = await contract.isClosed();
//       console.log(`ℹ️ Current channel status: ${isClosed ? "CLOSED" : "OPEN"}`);
//     } catch (e) {
//       console.log("⚠️ Could not check channel status");
//     }
//   }
// }

// async function main() {
//   //await fundChannels();

//   const senderChar = (await ask("Who are you? (A/B): ")).toUpperCase();
//   const sender = senderChar === "A" ? walletA : walletB;

//   console.log(`🎮 Starting micropayment session as Party ${senderChar}`);
//   console.log(`ℹ️ Initial Balances - A: ${ethers.formatEther(balanceA)} ETH, B: ${ethers.formatEther(balanceB)} ETH`);

//   while (true) {
//     const amountInput = await ask("💸 Enter amount to send (or 'exit' to finalize): ");
//     if (amountInput.toLowerCase() === "exit") {
//       // Generate and save the final state
//       const stateHash = ethers.solidityPackedKeccak256(
//         ["uint256", "uint256", "uint256", "address"],
//         [balanceA, balanceB, nonce, contractAddress]
//       );

//       const state = {
//         balanceA: balanceA.toString(),
//         balanceB: balanceB.toString(),
//         nonce,
//         sigA: await walletA.signMessage(ethers.getBytes(stateHash)),
//         sigB: await walletB.signMessage(ethers.getBytes(stateHash))
//       };

//       fs.writeFileSync("./storage/signedPayment.json", JSON.stringify(state, null, 2));
//       console.log(`✅ Final state saved (Nonce: ${nonce})`);

//       // Offer immediate finalization
//       // const confirm = await ask("❓ Submit final state to blockchain now? (yes/no): ");
//       // if (confirm.toLowerCase() === "yes") {
//       //   await finalizeChannel();
//       // } else {
//       //   console.log("💾 You can finalize later using the saved state");
//       // }
//       break;
//     }

//     try {
//       const amount = ethers.parseEther(amountInput);
      
//       // Update balances
//       if (senderChar === "A") {
//         if (balanceA < amount) throw new Error("Insufficient balance");
//         balanceA -= amount;
//         balanceB += amount;
//       } else {
//         if (balanceB < amount) throw new Error("Insufficient balance");
//         balanceB -= amount;
//         balanceA += amount;
//       }

//       nonce++;
//       console.log(`📊 New Balances - A: ${ethers.formatEther(balanceA)} ETH, B: ${ethers.formatEther(balanceB)} ETH`);
      
//       // Auto-save state after each update
//       const stateHash = ethers.solidityPackedKeccak256(
//         ["uint256", "uint256", "uint256", "address"],
//         [balanceA, balanceB, nonce, contractAddress]
//       );
      
//       fs.writeFileSync("./storage/signedPayment.json", JSON.stringify({
//         balanceA: balanceA.toString(),
//         balanceB: balanceB.toString(),
//         nonce,
//         sigA: await walletA.signMessage(ethers.getBytes(stateHash)),
//         sigB: await walletB.signMessage(ethers.getBytes(stateHash))
//       }, null, 2));
//     } catch (err) {
//       console.error("❌ Error:", err.message);
//     }
//   }

//   rl.close();
//   console.log("🛑 Session ended.");
// }

// main().catch((err) => {
//   console.error("❌ Script error:", err);
//   process.exit(1);
// });







require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");
const fs = require("fs");
const readline = require("readline");

// Setup provider and wallets
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
const walletA = new ethers.Wallet(process.env.PARTY_A_PRIVATE_KEY, provider);
const walletB = new ethers.Wallet(process.env.PARTY_B_PRIVATE_KEY, provider);

// Load contract
const deploymentData = JSON.parse(fs.readFileSync("./storage/deployment-bidirectional-ganache.json"));
const contractAddress = deploymentData.contractAddress;
const abi = require("../artifacts/contracts/BidirectionalPaymentChannel.sol/BidirectionalPaymentChannel.json").abi;
const contract = new ethers.Contract(contractAddress, abi, walletA);

// Setup initial balances
let balanceA = ethers.parseEther(process.env.PARTY_A_SEND);
let balanceB = ethers.parseEther(process.env.PARTY_B_SEND);
let nonce = 0;

// Setup readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// Helper: validate transaction
async function validatePayment(amount, senderBalance, receiverChar) {
  let ans = true;
  if(amount <= 0 || senderBalance < amount) ans = false;  //insufficient balance
  
  const ackResponse = await ask(`🖐 Will Party ${receiverChar} accept the payment of ${amount} ETH? (yes/no): `);
  const ack = ackResponse.toLowerCase() === "yes";
  if(!ack) ans = false;  //transaction not accepted
  return ans;
}

// Update on-chain balances
async function updateBalances() {
  const currentBalanceA = await provider.getBalance(walletA.address);
  const currentBalanceB = await provider.getBalance(walletB.address);

  console.log("\n💵 Current On-Chain Balances:");
  console.log(`- Party A: ${ethers.formatEther(currentBalanceA)} ETH`);
  console.log(`- Party B: ${ethers.formatEther(currentBalanceB)} ETH`);
}

// Finalize channel on-chain
async function finalizeChannel() {
  try {
    const payload = JSON.parse(fs.readFileSync("./storage/signedPayment.json"));
    console.log("📄 Using signed state with nonce:", payload.nonce);

    const stateHash = ethers.solidityPackedKeccak256(
      ["uint256", "uint256", "uint256", "address"],
      [payload.balanceA, payload.balanceB, payload.nonce, contractAddress]
    );

    const recoveredA = ethers.verifyMessage(ethers.getBytes(stateHash), payload.sigA);
    const recoveredB = ethers.verifyMessage(ethers.getBytes(stateHash), payload.sigB);

    if (recoveredA !== walletA.address || recoveredB !== walletB.address) {
      throw new Error("Invalid signatures!");
    }

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

    try {
      const isClosed = await contract.isClosed();
      console.log(`ℹ️ Current channel status: ${isClosed ? "CLOSED" : "OPEN"}`);
    } catch (e) {
      console.log("⚠️ Could not check channel status");
    }
  }
}

async function handleParty(){
  let input = await ask("Who are you? (A/B): ");
  return input;
}

// Main micropayment session
async function main() {
  
  while (true) {

    const signedState = JSON.parse(fs.readFileSync("./storage/signedPayment.json"));
    // Convert string balances to BigInt
    let balanceA = BigInt(signedState.balanceA);
    let balanceB = BigInt(signedState.balanceB);

    // Extract balances from signed state
    // balanceA = ethers.formatEther(balanceA);
    // balanceB = ethers.formatEther(balanceB);

    console.log(`🎮 Starting micropayment session`);
    console.log(`ℹ️ Initial Balances - A: ${ethers.formatEther(balanceA)} ETH, B: ${ethers.formatEther(balanceB)} ETH`);

    let senderChar, receiverChar;

    while (true) {
    const partyInput = await handleParty(); // returns A or B
    if (partyInput.toUpperCase() === "A") {
      senderChar = "A";
      receiverChar = "B";
      break;
    } else if (partyInput.toUpperCase() === "B") {
      senderChar = "B";
      receiverChar = "A";
      break;
    } else {
      console.log("❌ Invalid input! Please enter 'A' or 'B'.");
      // Loop will repeat until valid input
    }
  }

    // const sender = senderChar === "A" ? walletA : walletB;
    //receiverChar = senderChar === "A" ? "B" : "A";
    //const receiver = senderChar === "A" ? walletB : walletA;

    const amountInput = await ask("💸 Enter amount to send: ");
    //if (amountInput.toLowerCase() === "exit") break;

    

    

    try {
      if (!/^\d+(\.\d+)?$/.test(amountInput)) {
        console.log("❌ Invalid amount format!");
        continue;
      }

      const amount = ethers.parseEther(amountInput);
      let ack;

      // Validate transaction
      if (senderChar === "A") {
        ack = await validatePayment(amount, balanceA, receiverChar)
          ? { status: "ok" }
          : { status: "fail" };
      } else {
        ack = await validatePayment(amount, balanceB, receiverChar)
          ? { status: "ok" }
          : { status: "fail" };
      }

      if (ack.status === "ok") {
        if (senderChar === "A") {
          balanceA -= amount;
          balanceB += amount;
        } else {
          balanceB -= amount;
          balanceA += amount;
        }

        nonce++;
        console.log(`✅ Transaction accepted. New balances - A: ${ethers.formatEther(balanceA)} ETH, B: ${ethers.formatEther(balanceB)} ETH`);



        // Save signed state
        const stateHash = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "uint256", "address"],
          [balanceA, balanceB, nonce, contractAddress]
        );

        const state = {
          balanceA: balanceA.toString(),
          balanceB: balanceB.toString(),
          nonce,
          sigA: await walletA.signMessage(ethers.getBytes(stateHash)),
          sigB: await walletB.signMessage(ethers.getBytes(stateHash))
        };

        fs.writeFileSync("./storage/signedPayment.json", JSON.stringify(state, null, 2));

        const input = await ask("Do you want to continue micropayments? (yes/no): ");
        if (input.toLowerCase() === "no") break;

      } else {
        console.log("❌ Transaction rejected! Amount exceeds sender balance or not accepted by receiver.");
      }

      // Log acknowledgment for auditing
      //fs.writeFileSync(`./storage/ack_${nonce}.json`, JSON.stringify(ack, null, 2));

    } catch (err) {
      console.error("❌ Error:", err.message);
    }
  }

  // Save final signed state if exiting
  console.log("🛑 Session ended. You can now finalize the channel on-chain.");
  rl.close();
}

main().catch((err) => {
  console.error("❌ Script error:", err);
  process.exit(1);
});
