const axios = require("axios");
const payload = require("../storage/signedPayment.json");

async function redeem() {
  try {
    // Convert types explicitly
    const requestData = {
      from: payload.from,
      to: payload.to,
      amount: payload.amount,
      timestamp: Number(payload.timestamp),
      chainId: Number(payload.chainId),
      signature: payload.signature
    };

    console.log("Sending:", requestData);
    const response = await axios.post("http://localhost:3000/redeem", requestData);
    console.log("✅ Success:", response.data);
  } catch (error) {
    console.error("❌ Failed:", error.response?.data || error.message);
  }
}

redeem();