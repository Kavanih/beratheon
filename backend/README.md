# Beratheon Backend (FlowVault + deploy tooling)

Minimal backend scripts for testnet verification. Game API (Fastify/Postgres) is planned separately.

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env — add your testnet mnemonic (never commit .env)
npm install
```

## Commands

```bash
npm run wallet:info      # Show derived testnet STX address
npm run flowvault:smoke  # Deploy strategy + deposit USDCx on testnet
npm test                 # Both
```

## Prerequisites (testnet)

1. **STX** for gas — [Hiro faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet)
2. **USDCx** — [FlowVault bounty faucet](https://flow-vault.dev/bounty)

## Clarity contracts

See `../clarity-contracts/` — deploy with Clarinet:

```bash
cd ../clarity-contracts
pnpm install
clarinet check
clarinet deployments generate --testnet
clarinet deployments apply --testnet
```
