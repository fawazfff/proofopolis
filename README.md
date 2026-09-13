# Proofopolis

**Run the chain. Build the city.** Proofopolis is a fast three-lane arcade runner where verified Ethereum activity becomes a game pass and the player's reward becomes part of a living city on Creditcoin.

Built for **BUIDL CTC 2026 Fall - Gaming Track**.

## How to play

1. Press **Play Free Demo**, then **Verify Pass & Start Run**.
2. Move between three lanes with **Left/Right arrows** or **A/D**.
3. Jump with **Up**, **W**, or **Space**.
4. Collect cyan proof shards and avoid red corrupted blocks.
5. Reach the city gate at **650m** to unlock a verified landmark.

On phones, use the three large controls at the bottom of the screen. The playable demo needs no wallet. Its verification sequence is clearly labelled as a demo; the live proof-import route and smart-contract integration remain in the project for testnet use.

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

