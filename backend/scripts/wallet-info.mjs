import { generateWallet, getStxAddress } from '@stacks/wallet-sdk'

const mnemonic = process.env.STACKS_MNEMONIC?.trim()
const privateKey = process.env.STACKS_PRIVATE_KEY?.trim()

if (!mnemonic && !privateKey) {
  console.error('Set STACKS_MNEMONIC or STACKS_PRIVATE_KEY in backend/.env')
  process.exit(1)
}

const wallet = mnemonic
  ? await generateWallet({ secretKey: mnemonic, password: '' })
  : { accounts: [{ stxPrivateKey: privateKey }] }

const account = wallet.accounts[0]
const testnet = getStxAddress({ account, network: 'testnet' })
const mainnet = getStxAddress({ account, network: 'mainnet' })

console.log('Testnet address:', testnet)
console.log('Mainnet address:', mainnet)
console.log('Explorer:', `https://explorer.hiro.so/?chain=testnet&address=${testnet}`)
