# Beratheon — Deploy & Test Guide

## 1. Logo removed
Top bar shows screen title only. Sidebar crest/logo removed.

## 2. Cleanup (manual if still present)

These should not be in the repo:

```bash
rm -rf stable-diffusion-webui   # ~5GB local SD install
rm -f image.png                # never commit seed phrases
```

Already removed: `prompts/`, `gear/`, `pre.txt`, `todo.txt`, `fill.md`

## 3. Backend + FlowVault test (testnet)

Your test wallet (from `backend/.env`):

**`ST30PNQ7ZP471GY3BDM0XFT48EA5WC5GTQ0PG3XHR`**

```bash
cd backend
cp .env.example .env
# Edit .env — paste your 24-word testnet mnemonic (NEVER commit .env)

npm install
npm run wallet:info
npm run faucet:stx          # request testnet STX (wait ~30s)
npm run flowvault:smoke     # strategy + deposit USDCx
```

**Fund testnet wallet:**
- STX gas: https://explorer.hiro.so/sandbox/faucet?chain=testnet
- USDCx: https://flow-vault.dev/bounty

**Security:** If you shared your seed phrase in chat or an image, treat that wallet as compromised for mainnet. Use it for testnet only or create a new wallet.

## 4. Clarity contracts (Beratheon game)

Clarinet **v3.21** is installed locally at `.bin/clarinet`. Settings copied to `clarity-contracts/settings/`.

**Status:** Tuple field syntax fixed; `clarinet check` still has ~8 errors (missing stdlib helpers, `list` name collision in marketplace). Game contract deploy is not ready yet. **FlowVault bounty does not require deploying these.**

```bash
export PATH="$PWD/.bin:$PATH"
cd clarity-contracts
clarinet check
```

Deploy order is defined in `Clarinet.toml`. After deploy, wire contract addresses into the frontend env.

## 5. Frontend FlowVault (browser wallet)

```bash
cd frontend-next
npm run dev
```

Open http://localhost:3000 → **FlowVault** → connect Leather/Xverse (testnet) → deposit.

## 6. Bounty proof

Copy a successful testnet tx URL from:
- Backend: `npm run flowvault:smoke` output, or
- Frontend: Vault → On-Chain Proof panel

Format: `https://explorer.hiro.so/txid/<TXID>?chain=testnet`

See `FLOWVAULT.md` for form copy.
