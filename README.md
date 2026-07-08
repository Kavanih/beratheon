# Beratheon

Pixel RPG on Stacks — Next.js frontend + Clarity smart contracts.

## Repo layout

| Path | Description |
|------|-------------|
| `frontend-next/` | Next.js app (deploy this to Vercel) |
| `clarity-contracts/` | Clarity contracts, Clarinet config, testnet deployment plans |
| `backend/` | Node scripts (marketplace seed, faucet helpers) |

## Deploy frontend (Vercel)

1. Import this repo in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `frontend-next`.
3. Framework preset: **Next.js** (build: `npm run build`, output: default).
4. Add environment variables from `frontend-next/.env.example` (copy values from  deployed testnet contracts).
5. Deploy.

The app uses `/api/stacks/*` routes to proxy Hiro read-only calls (avoids browser CORS).

## Local dev

```bash
cd frontend-next
cp .env.example .env.local   # fill in contract IDs
npm install
npm run dev
```

## Contracts

```bash
cd clarity-contracts
clarinet check
# See scripts/deploy-testnet.sh for testnet deployment
```

Testnet deployer: `ST30PNQ7ZP471GY3BDM0XFT48EA5WC5GTQ0PG3XHR`

## Seed marketplace (optional)

```bash
cd backend
cp .env.example .env         # deployer mnemonic — never commit .env
npm install
npm run seed:marketplace
```
