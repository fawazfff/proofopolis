// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title SeedActions
/// @notice Small Sepolia source contract used to create game actions that Attestcoin can prove on CC3.
contract SeedActions {
    event TradeRecorded(address indexed player, uint256 amount);
    event CollectibleDiscovered(address indexed player, bytes32 indexed artifact);
    event VoteCast(address indexed player, uint256 indexed proposalId);

    function trade(uint256 amount) external { emit TradeRecorded(msg.sender, amount); }
    function discover(bytes32 artifact) external { emit CollectibleDiscovered(msg.sender, artifact); }
    function vote(uint256 proposalId) external { emit VoteCast(msg.sender, proposalId); }
}
