/**
 * End-to-end FlowVault testnet smoke test (backend signer mode).
 */
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk'
import { FlowVault, microToToken, tokenToMicro } from 'flowvault-sdk'

const mnemonic = process.env.STACKS_MNEMONIC?.trim()
const privateKeyEnv = process.env.STACKS_PRIVATE_KEY?.trim()

if (!mnemonic && !privateKeyEnv) {
  console.error('Set STACKS_MNEMONIC or STACKS_PRIVATE_KEY in backend/.env')
  process.exit(1)
}

const wallet = mnemonic
  ? await generateWallet({ secretKey: mnemonic, password: '' })
  : { accounts: [{ stxPrivateKey: privateKeyEnv }] }

const senderKey = wallet.accounts[0].stxPrivateKey
const address = getStxAddress({ account: wallet.accounts[0], network: 'testnet' })
const vault = new FlowVault({ network: 'testnet', senderKey })

console.log('Wallet:', address)
console.log('=== FlowVault smoke test (testnet) ===')

try {
  const height = await vault.getCurrentBlockHeight(address)
  console.log('Current block:', height)

  const rules = {
    lockAmount: tokenToMicro('1'),
    lockUntilBlock: height + 144,
    splitAddress: null,
    splitAmount: tokenToMicro('0'),
  }
  console.log('Setting strategy (lock 1 USDCx ~1 day)...')
  const strategyTx = await vault.createStrategy(rules)
  console.log('Strategy tx:', strategyTx.txId)
  console.log('  explorer:', `https://explorer.hiro.so/txid/${strategyTx.txId}?chain=testnet`)

  console.log('Depositing 2 USDCx...')
  const depositTx = await vault.deposit(tokenToMicro('2'))
  console.log('Deposit tx:', depositTx.txId)
  console.log('  explorer:', `https://explorer.hiro.so/txid/${depositTx.txId}?chain=testnet`)

  const state = await vault.getVaultState(address)
  console.log('Vault state:')
  console.log('  total:', microToToken(String(state.totalBalance)))
  console.log('  locked:', microToToken(String(state.lockedBalance)))
  console.log('  available:', microToToken(String(state.unlockedBalance)))
  console.log('PASS — FlowVault deposit succeeded')
} catch (err) {
  console.error('FAIL:', err?.message ?? err)
  console.error('Fund wallet: testnet STX faucet + USDCx from https://flow-vault.dev/bounty')
  process.exit(1)
}
