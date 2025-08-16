require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");
const fs = require("fs");

// Setup
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);

// Parameters
const from = wallet.address;
const to = process.env.RECEIVER_ADDRESS;
const amount = ethers.parseEther("1.0");
const timestamp = Math.floor(Date.now() / 1000);

(async () => {
  // Get numeric chainId (Ganache typically uses 1337)
  const chainId = (await provider.getNetwork()).chainId;
  
  // Create the message hash - ensure all values are properly encoded
  const message = ethers.solidityPackedKeccak256(
    ["address", "address", "uint256", "uint256", "uint256"], 
    [from, to, amount, timestamp, chainId]
  );

  // Sign the message
  const signature = await wallet.signMessage(ethers.getBytes(message));

  // Prepare payload with explicit type conversion
  const payload = {
    from,
    to,
    amount: amount.toString(), // Convert BigInt to string
    timestamp,
    chainId: Number(chainId), // Explicitly convert to number
    signature
  };

  // Save with BigInt handling
  fs.writeFileSync("../storage/signedPayment.json", JSON.stringify(payload, (_, v) => 
    typeof v === 'bigint' ? v.toString() : v, 2));
  
  console.log("📝 Signed payment saved to signedPayment.json");
  console.log("ℹ️ Chain ID:", chainId);
})();