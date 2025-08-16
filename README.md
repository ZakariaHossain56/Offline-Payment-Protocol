# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```


./file.txt → means "file.txt in the current directory"
../file.txt → means "file.txt in the parent directory"
../../file.txt → means "go up two directories, then look for file.txt"


## Commands
compile BidirectionalPaymentChannel.sol => npx hardhat compile

deploy smart contract => npx hardhat run scripts/deployBidirectional.js --network ganache 
                        (deployment info saved to deploy-bidirectional-ganache.json)

start backend server => npx hardhat run backend/server.js

fund the channel => npx hardhat run onchain/fundBidirectional.js
                        (funding info saved to fundingDetails.json)