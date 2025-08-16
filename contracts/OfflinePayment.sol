// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OfflinePayment {
    mapping(bytes32 => bool) public usedTxs;
    uint256 public constant PAYMENT_EXPIRY = 24 hours;

    event PaymentProcessed(
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes32 txHash
    );

    function verifyAndDeposit(
        address from,
        address to,
        uint256 amount,
        uint256 timestamp,
        uint256 chainId,
        bytes memory signature
    ) public payable{
        // 1. Validate timestamp freshness
        require(timestamp >= block.timestamp - PAYMENT_EXPIRY, "Payment expired");
        
        // 2. Verify chain ID
        require(chainId == block.chainid, "Wrong chain ID");

        // 3. Create and verify message
        bytes32 message = keccak256(
            abi.encodePacked(
                from,
                to,
                amount,
                timestamp,
                chainId
            )
        );
        bytes32 ethSignedMessage = prefixed(message);
        
        // 4. Recover signer with malleability protection
        address signer = recoverSigner(ethSignedMessage, signature);
        require(signer == from, "Invalid signature");

        // 5. Check for replay
        bytes32 txHash = keccak256(abi.encodePacked(message, signature));
        require(!usedTxs[txHash], "Already used");
        usedTxs[txHash] = true;

        // 6. Transfer funds (safer method)
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transfer failed");

        emit PaymentProcessed(from, to, amount, txHash);
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function recoverSigner(bytes32 message, bytes memory sig) 
        internal pure returns (address) 
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        
        // Prevent signature malleability
        require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, 
            "Invalid signature 's' value");
        
        return ecrecover(message, v, r, s);
    }

    function splitSignature(bytes memory sig)
        internal pure returns (uint8, bytes32, bytes32)
    {
        require(sig.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        // Handle Ethereum's signature scheme
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Invalid signature 'v' value");

        return (v, r, s);
    }

    receive() external payable {}
}