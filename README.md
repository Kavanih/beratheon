# Beratheon

**Play:** [beratheon.vercel.app](https://beratheon.vercel.app) · **Code:** [github.com/Kavanih/beratheon](https://github.com/Kavanih/beratheon)

Beratheon is a pixel dungeon RPG on **Stacks** where playing the game and participating in the economy are the same thing. We are building it as a **continuous, living project** — shipping features, contracts, and earn loops constantly, not as a one-off hackathon demo that stops after launch.

---

## Our aim

Most web3 games treat the wallet as an afterthought: connect, mint, disconnect. Beratheon is built around a different idea — **players and supporters should earn alongside the world we are building.**

We want people who show up early, play dungeons, list items, and back the ecosystem to share in what Beratheon becomes: loot, marketplace activity, liquidity, and on-chain ownership that compounds over time as the game grows.

Our long-term goal is a **player-owned adventure economy** on Stacks: you play, you craft, you trade, you stake — and the value you help create flows back to you, not only to a black-box treasury.

---

## What problem we solve

**For players:** RPG progression is usually trapped in a central database. You grind for hours and own nothing portable. Beratheon ties identity, materials, and market listings to **on-chain assets** (username NFTs, items SFT, STX marketplace) so your time in the world can mean something beyond one server save file.

**For the ecosystem:** DeFi and gaming rarely meet in a way normal users understand. Beratheon uses **FlowVault** inside the game UI — not a separate dashboard — so programmable money (lock, hold, split) becomes the rules of the world: pay to run, stake to support the market, earn when the market earns.

**For us as builders:** We need sustainable rails before we scale content. The vault and marketplace are the foundation; dungeons, crafting, conquest, and guild systems stack on top as we ship.

---

## The vault mechanism

FlowVault is Beratheon’s **treasury layer**. When you deposit USDCx, you choose a **strategy** that tells the vault how to route your money using three primitives:

| Primitive | Role in Beratheon |
|-----------|-------------------|
| **Lock** | Timed escrow — e.g. lock USDCx to enter Dungetron (proves you paid to play; unlocks after a set number of blocks) |
| **Hold** | Liquid balance you can withdraw anytime — used for supporter stake and flexible liquidity |
| **Split** | A slice sent to Beratheon treasury on deposit — funds ops and shared rewards as Gigamarket grows |

**How it fits together:**

- **Dungeon Run Escrow** — Lock + Hold: deposit USDCx, part locks as your dungeon entry fee, the rest stays yours to withdraw.
- **Gigamarket Revenue Split** — Split + Hold: deposit USDCx, a portion supports the project treasury, the remainder is your **liquidity stake** — the basis for fee-share style rewards as on-chain trading matures.
- **Underhaul Entry** — higher Lock threshold for premium dungeon content.

The vault is not cosmetic. It gates content, aligns incentives, and gives supporters a clear on-chain stake in Beratheon’s market and growth.

---

## How players can earn with us

Beratheon is designed so participation has upside as we expand:

- **Play & loot** — clear dungeon rooms, keep materials and gold; on-chain item layers are live and growing.
- **Trade on Gigamarket** — list materials for STX on `marketplace.clar`; buy and sell in a player-driven market (more settlement depth shipping continuously).
- **Stake via FlowVault** — HOLD balance from Gigamarket strategy positions you for **fee share** as marketplace volume and on-chain settlement go live.
- **Own on-chain identity & items** — username NFTs and items SFT are portable assets on Stacks, not session-only progress.

We are intentionally building earn paths in public: early players and stakers are part of the story, not an audience watching a finished product drop.

---

## What exists today (and what’s next)

**Live now:** Hall of Heroes hub, Dungetron combat, FlowVault Treasury, Gigamarket (arcade + on-chain STX listings), workbench crafting, Stacks wallet connect, testnet Clarity contracts (marketplace, items-sft, username NFT, and more).

**In active development:** deeper marketplace settlement, dungeon ↔ vault automation, crafting and conquest on-chain, gear systems, IPFS metadata, mainnet path — this repo updates as we build.

Beratheon is **never “done”** in the hackathon sense. It is a product we intend to keep extending: new floors, new items, new earn loops, tighter chain integration every cycle.


