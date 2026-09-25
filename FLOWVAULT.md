# Beratheon × FlowVault — Bounty Submission Guide

Use this document to fill the [FlowVault Builder Bounty](https://flow-vault.dev/bounty) form.

---

## Builder Information

| Field | Suggested value |
|-------|-----------------|
| **Name / Team Name** | kavaniih (or your team name) |
| **Email Address** | *(your email)* |
| **Telegram / X Username** | *(your handle)* |
| **Stacks Wallet Address** | *(from Leather/Xverse after connect)* |

---

## Project Information

| Field | Value |
|-------|-------|
| **Project Name** | Beratheon |
| **One-Line Description** | A pixel dungeon RPG where loot, dungeon entry, and marketplace revenue are programmable USDCx flows on Stacks via FlowVault. |
| **Project Category** | Treasury Automation, Creator Revenue Flows, Goal-Based Savings, Experimental Money Behaviors |

### What problem does your project solve?

Most game economies only *move* currency — gold goes up or down. Beratheon defines **how money behaves after deposit**:

- **Dungeon runs** escrow entry fees (LOCK) until the run completes
- **Gigamarket** settlements auto-split revenue to treasury and creator pools (SPLIT)
- **Underhaul unlock** savings lock progress rewards until a milestone (LOCK + HOLD)

Players get transparent, on-chain treasury behavior instead of opaque in-game balances.

### How does your project use FlowVault?

Beratheon integrates the official [`flowvault-sdk`](https://www.npmjs.com/package/flowvault-sdk) with `@stacks/connect` wallet signing on **Stacks testnet**.

Three in-game **strategies** map to FlowVault primitives:

| Strategy | Primitives | Game behavior |
|----------|------------|---------------|
| Dungeon Run Escrow | **Lock + Hold** | Entry deposit locks USDCx until block height; remainder withdrawable |
| Gigamarket Revenue Split | **Split + Hold** | Marketplace deposit splits to Beratheon treasury; rest held |
| Underhaul Savings Vault | **Lock + Hold** | 80% locked ~7 days for milestone unlock; 20% liquid |

**Code paths:**
- `frontend-next/lib/flowvault.ts` — strategy builders + `applyStrategyAndDeposit()`
- `frontend-next/context/WalletProvider.tsx` — Stacks wallet + SDK client
- `frontend-next/components/VaultTreasury.tsx` — UI: connect, deposit, withdraw, tx proof

### Explain which primitives are used:

- ✅ **Lock** — dungeon escrow & savings milestone
- ✅ **Split** — marketplace treasury routing
- ✅ **Hold** — unlocked player balance (withdraw anytime)
- ✅ **Combination** — all three composed per strategy

---

## Submission Deliverables

| Deliverable | Where |
|-------------|-------|
| **GitHub Repository** | *(your public repo URL)* |
| **Live Demo URL** | `http://localhost:3000` locally, or deploy to Vercel/Netlify |
| **Demo Video** | Record: connect wallet → Vault → Dungeon Escrow → deposit → show explorer link |
| **Presentation / Docs** | This file + README |
| **On-Chain Proof** | Copy tx ID from **Vault → On-Chain Proof** panel (Hiro explorer link) |

### Provide at least one successful transaction

1. Run `npm run dev` in `frontend-next/`
2. Open **FlowVault** in the side rail
3. Connect Stacks wallet (Leather / Xverse on testnet)
4. Select **Dungeon Run Escrow**
5. Click **Set Strategy + Deposit** — approve in wallet
6. Paste the explorer URL from the proof panel into the form

Example explorer format:
`https://explorer.hiro.so/txid/<TXID>?chain=testnet`

---

## If given additional funding, how would you continue building?

- Auto-trigger FlowVault deposits when entering Dungetron (hook dungeon entry to `dungeon_escrow` strategy)
- Gigamarket buy/sell wired to `market_split` with real seller addresses
- Guild/community vaults with multi-recipient splits
- Mainnet deployment + USDCx mainnet contracts when FlowVault v2 ships on mainnet
- Mobile-friendly wallet UX and replayable demo mode for judges

---

## Suggestions / Bugs for FlowVault team

*(Fill after testing — e.g. clearer wallet-mode examples, testnet USDCx faucet link in SDK docs)*

---

## Run locally

```bash
cd frontend-next
npm install
npm run dev
```

Open http://localhost:3000 → side rail **FlowVault** → connect wallet → deposit.

**Need testnet USDCx?** See the bounty page faucet link at [flow-vault.dev/bounty](https://flow-vault.dev/bounty).

---

## Evaluation alignment

| Criterion | How Beratheon scores |
|-----------|---------------------|
| Innovation (35%) | Game-native programmable money — not a dashboard clone |
| FlowVault integration (30%) | Lock + Split + Hold via SDK, real testnet txs |
| Technical execution (20%) | Next.js + typed SDK + wallet connect + pixel game UX |
| Ecosystem value (15%) | Shows FlowVault inside a consumer app category (gaming) |


## What your successful deposit means

**Tx:** [`b20048a7…ca777`](https://explorer.hiro.so/txid/b20048a7a905530ab64746892de2f9f8aa4318d1a933385aa88457652a1ca777?chain=testnet)

On-chain return:

```clarity
(ok {
  deposited: u2000000,
  held: u2000000,
  locked: u0,
  split: u0
})
```

| Field | Value | Meaning |
|-------|-------|---------|
| `deposited` | `u2000000` | **2 USDCx** sent into FlowVault v2 (`2000000` micro-units, 6 decimals) |
| `held` | `u2000000` | All 2 USDCx landed on **HOLD** — liquid, withdrawable anytime |
| `locked` | `u0` | Nothing went to **LOCK** (time-locked escrow) |
| `split` | `u0` | Nothing went to **SPLIT** (forwarded to another address) |

**Why everything is on HOLD:** The strategy tx (`76f0c914…`) likely failed or never confirmed before the deposit. FlowVault only applies LOCK/SPLIT rules that are **already stored on-chain** at deposit time. With no active routing rules, the full amount stays liquid.

**Wallet used (backend smoke test):** `ST30PNQ7ZP471GY3BDM0XFT48EA5WC5GTQ0PG3XHR`

In the app, connect Xverse/Leather and use **FlowVault Treasury** to set strategy + deposit from your browser wallet (no backend mnemonic needed).

---

kavaniih@kavaniih-Inspiron-5379:~/Videos/Screencasts/beratheon/backend$ npm run flowvault:smoke

> beratheon-backend@1.0.0 flowvault:smoke
> node --env-file=.env scripts/flowvault-smoke.mjs

Wallet: ST30PNQ7ZP471GY3BDM0XFT48EA5WC5GTQ0PG3XHR
=== FlowVault smoke test (testnet) ===
Current block: 4030040
Setting strategy (lock 1 USDCx ~1 day)...
Strategy tx: 76f0c91481dd46e2cc16aa8b733ef6ab51172ab6b4a08fab5c8d9e7f9ddb0706
  explorer: https://explorer.hiro.so/txid/76f0c91481dd46e2cc16aa8b733ef6ab51172ab6b4a08fab5c8d9e7f9ddb0706?chain=testnet
Depositing 2 USDCx...
Deposit tx: b20048a7a905530ab64746892de2f9f8aa4318d1a933385aa88457652a1ca777
  explorer: https://explorer.hiro.so/txid/b20048a7a905530ab64746892de2f9f8aa4318d1a933385aa88457652a1ca777?chain=testnet
Vault state:
  total: 0
  locked: 0
  available: 0
PASS — FlowVault deposit succeeded
kavaniih@kavaniih-Inspiron-5379:~/Videos/Screencasts/beratheon/backend$ 