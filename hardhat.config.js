require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: ["0x873dfbf03ddb2646a62fab5b9fdade6a25d821c508b32f73de599862734d4bf2"]  //private key
    }
  }
};
