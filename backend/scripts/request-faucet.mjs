import { generateWallet, getStxAddress } from '@stacks/wallet-sdk'

const mnemonic = process.env.STACKS_MNEMONIC?.trim()
if (!mnemonic) {
  console.error('Set STACKS_MNEMONIC in backend/.env')
  process.exit(1)
}

const wallet = await generateWallet({ secretKey: mnemonic, password: '' })
const address = getStxAddress({ account: wallet.accounts[0], network: 'testnet' })

console.log('Requesting testnet STX for', address)
const url = `https://api.testnet.hiro.so/extended/v1/faucets/stx?address=${encodeURIComponent(address)}&stacking=false`
const res = await fetch(url, { method: 'POST' })

const text = await res.text()
console.log('Status:', res.status)
console.log(text.slice(0, 500))
if (!res.ok) {
  console.error('Faucet request failed — use https://explorer.hiro.so/sandbox/faucet?chain=testnet manually')
  process.exit(1)
}
console.log('STX faucet request sent. Wait ~30s then run: npm run flowvault:smoke')
