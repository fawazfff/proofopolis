Exit code: 0
Wall time: 0.8 seconds
Output:
# Proofopolis

**Your wallet is your deck.** Proofopolis is an isometric city-building puzzle where players turn Attestcoin-verified Ethereum activity into strategic building tiles on Creditcoin.

Built for **BUIDL CTC 2026 Fall Â· Gaming Track**.

## Playable loop

1. Prove a successful Ethereum Sepolia game action.
2. Attestcoin verifies inclusion and continuity on Creditcoin CC3.
3. The source event unlocks a Market, Gallery, or Council tile.
4. Place it on the 5Ã—5 city board; adjacent landmarks earn bonuses.
5. Every transaction can be consumed only once.

The deployed web demo includes a fast judge-friendly proof simulation and a live Sepolia proof importer. The simulation is clearly labelled and never substitutes for the production contract path.

## Attestcoin integration

`Proofopolis.sol` calls the native query verifier at `0x0000000000000000000000000000000000000FD2` through the current `@gluwa/asc-contracts` interface. After verification it decodes the exact proven transaction and receipt with `EvmV1Decoder`, then enforces:

- Creditcoin chain key `1` (Ethereum Sepolia)
- successful source receipt
- source transaction sender equals the player
- allowlisted `SeedActions` emitter
- expected event signature and indexed player
- replay protection from `(chainKey, blockHeight, txIndex)`

Only then does Creditcoin create the game tile. See [the full integration notes](docs/ATTESTCOIN_INTEGRATION.md).

## Run locally

```bash
npm install
npm test
npm run contracts:compile
npm run dev
```

Copy `.env.example` to `.env.local` to configure infrastructure and the deployed CC3 contract address.

## Project structure

- `app/` â€” Next.js game and proof-builder endpoint
- `components/` â€” playable isometric city interface
- `contracts/src/` â€” Sepolia source and CC3 game contracts
- `lib/` â€” deterministic game/scoring logic and contract ABI
- `tests/` â€” gameplay tests
- `docs/` â€” protocol architecture and runbook

## Status

Hackathon testnet prototype. Not audited; no real-value assets.

