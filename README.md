# Proof or Bluff

**Every wallet has a story. Someone is lying.** Proof or Bluff is a social-deduction game where rivals make claims about their Ethereum history and Attestcoin reveals the truth on Creditcoin.

Built for **BUIDL CTC 2026 Fall - Gaming Track**.

## How to play

1. Read a rival's claim about an Ethereum transaction.
2. Inspect the visible method and receipt fragment.
3. Choose **Believe** or **Call Bluff**.
4. Watch Attestcoin verify and decode the cross-chain receipt.
5. Correct reads win chips; wrong reads cost a heart.

The solo demo needs no wallet and contains three fast cases. Its proof sequence is clearly labelled as a demo; the live proof-import route and smart-contract integration remain in the project for testnet use.

## Attestcoin integration

`Proofopolis.sol` calls the native query verifier at `0x0000000000000000000000000000000000000FD2` through the current `@gluwa/asc-contracts` interface. After verification it decodes the proven transaction and receipt with `EvmV1Decoder`, then enforces:

- Creditcoin chain key `1` (Ethereum Sepolia)
- successful source receipt
- source transaction sender equals the player
- allowlisted `SeedActions` emitter
- expected event signature and indexed player
- replay protection from `(chainKey, blockHeight, txIndex)`

Only then does Creditcoin issue the one-use game reward. See [the full integration notes](docs/ATTESTCOIN_INTEGRATION.md).

## Run locally

```bash
npm install
npm test
npm run contracts:compile
npm run dev
```

Copy `.env.example` to `.env.local` to configure infrastructure and the deployed CC3 contract address.

## Project structure

- `app/` - Next.js runner and proof-builder endpoint
- `components/RunnerGame.tsx` - scene flow, input, and fixed-timestep game loop
- `contracts/src/` - Sepolia source and CC3 game contracts
- `lib/runner.ts` - deterministic lane and collision logic
- `tests/` - gameplay tests
- `docs/` - protocol architecture and testnet runbook

## Status

Hackathon testnet prototype. Not audited; no real-value assets.

