require("dotenv").config({ path: "../.env" });
const express = require("express");
const { ethers } = require("ethers");
const fs = require("fs");

const app = express();
app.use(express.json({ limit: "10mb" }));

// Load deployment info
const config = require("../storage/deployment-bidirectional-ganache.json");
const contractAddress = config.contractAddress;
const abi = require("../artifacts/contracts/BidirectionalPaymentChannel.sol/BidirectionalPaymentChannel.json").abi;

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
const wallet = new ethers.Wallet(process.env.PARTY_A_PRIVATE_KEY, provider);


// Create contract instance
const contract = new ethers.Contract(contractAddress, abi, wallet);


// Enhanced contract state checker
async function checkContractState() {
    try {
        return {
            nonce: await contract.nonce(),
            expiryTime: new Date((await contract.expiryTime()) * 1000),
            depositA: ethers.formatEther(await contract.depositA()),
            depositB: ethers.formatEther(await contract.depositB()),
            balanceA: ethers.formatEther(await contract.balanceA()),
            balanceB: ethers.formatEther(await contract.balanceB()),
            isClosed: await contract.isClosed(),
            contractBalance: ethers.formatEther(await provider.getBalance(contractAddress)),
            partyA: await contract.partyA(),
            partyB: await contract.partyB()
        };
    } catch (error) {
        console.error("Error checking contract state:", error);
        throw error;
    }
}

// Redemption endpoint with enhanced validation
app.post("/redeem", async (req, res) => {
    try {
        console.log("Incoming redemption request:", req.body);
        
        // Validate request
        if (!req.body) {
            return res.status(400).json({ success: false, error: "Empty request body" });
        }

        const { finalBalanceA, finalBalanceB, finalNonce, sigA, sigB } = req.body;

        // Validate required fields
        const requiredFields = ['finalBalanceA', 'finalBalanceB', 'finalNonce', 'sigA', 'sigB'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Check contract state before proceeding
        const state = await checkContractState();
        console.log("Current contract state:", state);

        // Prepare transaction
        const feeData = await provider.getFeeData();
        const txOptions = {
            gasLimit: 500000,
            gasPrice: feeData.gasPrice
        };

        // Send transaction
        console.log("Sending submitFinalState transaction...");
        const tx = await contract.submitFinalState(
            finalBalanceA,
            finalBalanceB,
            finalNonce,
            sigA,
            sigB,
            txOptions
        );

        console.log("Transaction sent, waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt.hash);

        // Verify final state
        const postState = await checkContractState();
        if (!postState.isClosed) {
            throw new Error("Channel failed to close after transaction");
        }

        res.json({
            success: true,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            finalState: postState
        });

    } catch (error) {
        console.error("Redemption error:", error);
        
        // Enhanced error parsing
        let errorMessage = error.reason?.replace("execution reverted: ", "") || 
                         error.error?.message || 
                         error.message;
        
        // Check for specific revert reasons
        if (error.data) {
            try {
                const parsedError = contract.interface.parseError(error.data);
                errorMessage = parsedError.name;
            } catch (e) {
                // Couldn't parse the error
            }
        }

        res.status(400).json({
            success: false,
            error: errorMessage,
            ...(process.env.NODE_ENV === "development" && { 
                stack: error.stack,
                details: error 
            })
        });
    }
});

// Add endpoint to check contract state
app.get("/state", async (req, res) => {
    try {
        const state = await checkContractState();
        res.json({ success: true, state });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📋 Ready to accept redemption requests`);
    console.log(`🔗 Contract address: ${contractAddress}`);
});