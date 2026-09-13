# Attestcoin integration

## Data path

`SeedActions (Sepolia)` → `@gluwa/usc-sdk ProofBuilder` → `Native Query Verifier (CC3 0xFD2)` → `Proofopolis` → playable tile.

The server endpoint uses `ProofBuilder.getProof(txHash)` for chain key 1. The resulting transaction bytes, Merkle path and continuity proof are submitted directly to `Proofopolis.proveBuilding` by the player's wallet.

## Security gates

Proof inclusion alone is not sufficient. The contract also verifies receipt success, player ownership, source chain, source emitter, event type, indexed player and one-time consumption. Failed checks revert before game state changes.

## Live deployment order

1. Deploy `SeedActions.sol` to Ethereum Sepolia.
2. Deploy `Proofopolis.sol(seedActionsAddress)` to CC3 testnet (chain ID 102031).
3. Set `NEXT_PUBLIC_PROOFOPOLIS_CONTRACT` on Vercel.
4. Call `trade`, `discover`, or `vote` on Sepolia and wait for attestation.
5. Import the transaction hash in the game and approve the CC3 transaction.

Never use a wallet containing real-value assets for hackathon deployment.
