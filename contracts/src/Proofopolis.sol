// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {INativeQueryVerifier, NativeQueryVerifierLib} from "@gluwa/asc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";
import {EvmV1Decoder} from "@gluwa/asc-contracts/contracts/common/EvmV1Decoder.sol";

/// @title Proofopolis
/// @notice Turns Attestcoin-verified Ethereum events into one-use city tiles on Creditcoin.
contract Proofopolis {
    using EvmV1Decoder for bytes;
    uint64 public constant SEPOLIA_CHAIN_KEY = 1;
    uint8 public constant BOARD_SIZE = 5;
    bytes32 private constant TRADE = keccak256("TradeRecorded(address,uint256)");
    bytes32 private constant COLLECT = keccak256("CollectibleDiscovered(address,bytes32)");
    bytes32 private constant VOTE = keccak256("VoteCast(address,uint256)");
    INativeQueryVerifier public immutable verifier = NativeQueryVerifierLib.getVerifier();
    address public immutable owner;
    address public sourceContract;
    uint256 public nextTileId = 1;

    struct Tile { address player; uint8 kind; uint16 baseScore; bool placed; }
    mapping(bytes32 => bool) public consumedProofs;
    mapping(uint256 => Tile) public tiles;
    mapping(address => mapping(uint8 => mapping(uint8 => uint256))) public board;
    mapping(address => uint256) public scoreOf;

    event BuildingProved(address indexed player, uint256 indexed tileId, bytes32 indexed proofId, uint8 kind, uint16 baseScore);
    event BuildingPlaced(address indexed player, uint256 indexed tileId, uint8 x, uint8 y, uint256 score);

    constructor(address sourceContract_) { owner = msg.sender; sourceContract = sourceContract_; }
    function setSourceContract(address value) external { require(msg.sender == owner, "owner only"); sourceContract = value; }

    function proveBuilding(
        uint8 action, uint64 chainKey, uint64 blockHeight, bytes calldata encodedTransaction,
        bytes32 merkleRoot, INativeQueryVerifier.MerkleProofEntry[] calldata siblings,
        bytes32 lowerEndpointDigest, bytes32[] calldata continuityRoots
    ) external returns (bytes32 proofId, uint256 tileId) {
        require(action < 3, "unknown action");
        require(chainKey == SEPOLIA_CHAIN_KEY, "wrong source chain");
        INativeQueryVerifier.MerkleProof memory merkle = INativeQueryVerifier.MerkleProof(merkleRoot, siblings);
        uint64 txIndex = verifier.calculateTxIndex(merkle);
        proofId = keccak256(abi.encode(chainKey, blockHeight, txIndex));
        require(!consumedProofs[proofId], "proof already consumed");
        bool valid = verifier.verifyAndEmit(chainKey, blockHeight, encodedTransaction, merkle,
            INativeQueryVerifier.ContinuityProof(lowerEndpointDigest, continuityRoots));
        require(valid, "Attestcoin rejected proof");

        EvmV1Decoder.CommonTxFields memory txFields = encodedTransaction.decodeCommonTxFields();
        EvmV1Decoder.ReceiptFields memory receipt = encodedTransaction.decodeReceiptFields();
        require(receipt.receiptStatus == 1, "source transaction failed");
        require(txFields.from == msg.sender, "not transaction sender");
        require(_containsExpectedEvent(receipt, action, msg.sender), "expected source event missing");

        consumedProofs[proofId] = true;
        tileId = nextTileId++;
        uint16 baseScore = uint16(46 + action * 9 + uint16(uint256(proofId) % 8));
        tiles[tileId] = Tile(msg.sender, action, baseScore, false);
        emit BuildingProved(msg.sender, tileId, proofId, action, baseScore);
    }

    function placeTile(uint256 tileId, uint8 x, uint8 y) external {
        require(x < BOARD_SIZE && y < BOARD_SIZE, "outside city");
        Tile storage tile = tiles[tileId];
        require(tile.player == msg.sender && !tile.placed, "tile unavailable");
        require(board[msg.sender][x][y] == 0, "plot occupied");
        tile.placed = true; board[msg.sender][x][y] = tileId;
        uint256 bonus;
        if (x > 0 && board[msg.sender][x-1][y] != 0) bonus += 18;
        if (x+1 < BOARD_SIZE && board[msg.sender][x+1][y] != 0) bonus += 18;
        if (y > 0 && board[msg.sender][x][y-1] != 0) bonus += 18;
        if (y+1 < BOARD_SIZE && board[msg.sender][x][y+1] != 0) bonus += 18;
        scoreOf[msg.sender] += tile.baseScore + bonus;
        emit BuildingPlaced(msg.sender, tileId, x, y, scoreOf[msg.sender]);
    }

    function _containsExpectedEvent(EvmV1Decoder.ReceiptFields memory receipt, uint8 action, address player) private view returns (bool) {
        bytes32 expected = action == 0 ? TRADE : action == 1 ? COLLECT : VOTE;
        bytes32 playerTopic = bytes32(uint256(uint160(player)));
        for (uint256 i; i < receipt.receiptLogs.length; ++i) {
            EvmV1Decoder.LogEntry memory entry = receipt.receiptLogs[i];
            if (entry.address_ == sourceContract && entry.topics.length > 1 && entry.topics[0] == expected && entry.topics[1] == playerTopic) return true;
        }
        return false;
    }
}
