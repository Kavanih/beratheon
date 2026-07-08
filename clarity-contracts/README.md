# Beratheon Clarity Contracts

Smart contracts for Beratheon, a rogue-lite RPG on Stacks blockchain.

## Overview

This workspace contains all on-chain primitives for Beratheon V1:

- **Token Contracts** (SIP-compliant, non-proxied):
  - `honey-token.clar` — $HONEY (SIP-010, 6 decimals, 1B cap)
  - `juice-token.clar` — $JUICE (SIP-010, 0 decimals, 100K cap)
  - `cub-nft.clar` — Hero NFT (SIP-009, 10K cap, immutable traits)
  - `username-nft.clar` — Username NFT (SIP-009, one per wallet)
  - `items-sft.clar` — Game items (SIP-013, 6 categories)
  - `noob-pass.clar` — Early-access pass (SIP-009, 1024 cap, merkle-gated)

- **Core System Contracts** (upgradeable via game-registry):
  - `game-registry.clar` — System principal resolver for upgradeability
  - `game-authority.clar` — Authoritative game settler (signed payloads, nonce replay protection)
  - `marketplace.clar` — Order book (2.5% fee, bulk fills)
  - `crafting.clar` — Recipe registry & XP tracking
  - `conquest.clar` — Faction territory control (24h rounds, merkle claims)
  - `echoes.clar` — Commit-reveal echo snapshots

- **Traits**:
  - `traits.clar` — SIP-009, SIP-010, SIP-013 trait re-exports + game-authority trait

## Setup

### Prerequisites

- Node.js 18+
- Clarinet 2.x (or use Docker)
- pnpm

### Installation

```bash
cd clarity-contracts
pnpm install
```

### Build & Check

```bash
clarinet check
```

### Run Tests

```bash
pnpm test
```

Tests use `clarinet-sdk` + Vitest and cover:
- Token mint/burn/transfer
- NFT trait generation & immutability
- Marketplace list/buy/cancel with fee correctness
- Game authority signature verification & nonce replay
- Conquest round settlement & merkle claims
- Crafting input/output & XP tracking

### Console

Interactive REPL for testing:

```bash
clarinet console
```

Example:

```clarity
(contract-call? .honey-token get-total-supply)
(contract-call? .cub-nft get-last-token-id)
```

## Deployment

### Testnet

```bash
clarinet deployments testnet
```

### Mainnet

```bash
clarinet deployments mainnet
```

### Deployment Order

1. `traits` (no deps)
2. `honey-token`, `juice-token` (depend on traits)
3. `items-sft`, `cub-nft`, `username-nft`, `noob-pass` (depend on traits)
4. `game-registry` (no gameplay deps)
5. `game-authority` (depends on tokens, items)
6. `marketplace` (depends on items, cub-nft, username-nft)
7. `crafting` (depends on items, game-authority)
8. `conquest` (depends on items, game-authority)
9. `echoes` (depends on honey-token, game-authority)

### Post-Deploy Setup

After deployment, the deployer must:

1. Call `set-authority` on each gameplay contract, passing `game-authority` principal
2. Call `set-game-signer` on `game-authority`, passing backend multisig principal
3. Call `initialize-uri-root` on `cub-nft` with IPFS root
4. Call `set-merkle-root` on `noob-pass` with whitelist root
5. Rotate `game-authority` owner to multisig (optional, for decentralization)

## Security Model

### Authority Flow

All gameplay mutations (loot grants, crafting, conquest) flow through `game-authority`:

1. Backend computes game state transition (e.g., dungeon run outcome)
2. Backend signs payload with game-signer private key
3. FE submits signed payload + user's contract-call
4. Contract verifies signature against game-signer pubkey
5. Contract checks nonce hasn't been used (replay protection)
6. Contract executes mutation (mint, burn, transfer)

### Key Invariants

- **No unbounded loops**: All folds use bounded list lengths (max 100 items)
- **No reentrancy**: Token transfers use post-conditions (FE responsibility)
- **Nonce replay**: Every game-authority settle uses a unique nonce hash
- **Immutable traits**: Cub cosmetics frozen post-mint via map-only-read
- **Soulbound items**: Items-sft can be burned by holder; marketplace handles transfers

## Error Codes

### Common

- `u1` — Unauthorized (tx-sender mismatch or authority check failed)
- `u2` — Invalid amount (zero or negative)
- `u3` — Insufficient balance
- `u4` — Authority not set
- `u5` — Supply cap exceeded

### Contract-Specific

- **Marketplace**: `u6` listing not found, `u7` qty exceeds listing, `u8` listing expired, `u9` empty fills list, `u10` authority check
- **Conquest**: `u3` round not active, `u4` round already settled, `u5` merkle proof invalid, `u6` leaderboard not found
- **Crafting**: `u5` recipe disabled, `u6` recipe not found
- **Echoes**: `u3` no echo commit, `u4` echo already revealed, `u5` bounty amount invalid

## File Structure

```
clarity-contracts/
├── Clarinet.toml              # Workspace config
├── contracts/
│   ├── traits.clar
│   ├── honey-token.clar
│   ├── juice-token.clar
│   ├── items-sft.clar
│   ├── cub-nft.clar
│   ├── username-nft.clar
│   ├── noob-pass.clar
│   ├── game-registry.clar
│   ├── game-authority.clar
│   ├── marketplace.clar
│   ├── crafting.clar
│   ├── conquest.clar
│   └── echoes.clar
├── tests/
│   ├── honey-token.test.ts
│   ├── cub-nft.test.ts
│   ├── marketplace.test.ts
│   ├── game-authority.test.ts
│   ├── conquest.test.ts
│   └── crafting.test.ts
├── README.md
└── package.json
```

## References

- [Clarity Language](https://docs.stacks.co/clarity)
- [SIP-009 (NFT)](https://github.com/stacksgov/sips/blob/main/sips/sip-009/sip-009-nft-standard.md)
- [SIP-010 (FT)](https://github.com/stacksgov/sips/blob/main/sips/sip-010/sip-010-ft-standard.md)
- [SIP-013 (SFT)](https://github.com/stacksgov/sips/blob/main/sips/sip-013/sip-013-sft-standard.md)
- [Stacks Docs](https://docs.stacks.co/)

## License

Proprietary — Beratheon Team
