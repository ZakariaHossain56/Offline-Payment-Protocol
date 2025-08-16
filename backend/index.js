require("dotenv").config({ path: "../.env" });
const express = require("express");
const { ethers } = require("ethers");
const fs = require("fs");

const app = express();
app.use(express.json({ limit: "10mb" })); // For handling large signatures

// Load deployment info
const config = require("../storage/deployment-ganache.json");
const contractAddress = config.contractAddress;
const abi = require("../artifacts/contracts/OfflinePayment.sol/OfflinePayment.json").abi;

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Create contract instance
const contract = new ethers.Contract(contractAddress, abi, wallet);

// Verify contract is deployed
(async () => {
  try {
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.error("❌ No contract deployed at:", contractAddress);
      process.exit(1);
    }
    console.log("✅ Verified contract at:", contractAddress);
  } catch (err) {
    console.error("❌ Contract verification failed:", err);
    process.exit(1);
  }
})();

// Redemption endpoint
app.post("/redeem", async (req, res) => {
  try {
    // 1. Validate request body
    if (!req.body) {
      return res.status(400).json({ success: false, error: "Empty request body" });
    }

    // 2. Destructure and validate required fields
    const { from, to, amount, timestamp, chainId, signature } = req.body;
    if (!from || !to || !amount || !timestamp || !chainId || !signature) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields" 
      });
    }

    // Get current gas price (ethers v6 syntax)
    const feeData = await provider.getFeeData();

    // 3. Convert to correct types
    const tx = await contract.verifyAndDeposit(
      from, // address
      to, // address
      ethers.parseUnits(amount.toString(), 0), // uint256 (wei)
      Number(timestamp), // uint256
      Number(chainId), // uint256
      signature, // bytes
      {
        gasLimit: 500000,
        gasPrice: feeData.gasPrice // Use the new feeData object
      }
    );

    // 4. Wait for confirmation
    const receipt = await tx.wait();
    
    res.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    });

  } catch (error) {
    console.error("Redemption error:", error);
    
    // Extract the most relevant error message
    const errorMessage = error.reason?.replace("execution reverted: ", "") || 
                        error.error?.message || 
                        error.message;

    res.status(400).json({
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack })
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📋 Ready to accept redemption requests`);
  console.log(`🔗 Contract address: ${contractAddress}`);
});