/**
 * Deploy marketplace-v2 (escrow + item transfer) to testnet.
 *
 * Usage:
 *   npm run deploy:marketplace-v2
 *
 * Then set in frontend-next/.env.local:
 *   NEXT_PUBLIC_MARKETPLACE_CONTRACT=<deployer>.marketplace-v2
 */
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  AnchorMode,
  broadcastTransaction,
  makeContractDeploy,
} from '@stacks/transactions'
import { STACKS_TESTNET } from '@stacks/network'
import { loadSignerWallet } from './lib/wallet.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const contractPath = path.join(__dirname, '../../clarity-contracts/contracts/marketplace.clar')
const source = readFileSync(contractPath, 'utf8')

const DEPLOYER = process.env.BERATHEON_DEPLOYER ?? 'ST30PNQ7ZP471GY3BDM0XFT48EA5WC5GTQ0PG3XHR'
const TREASURY = process.env.BERATHEON_TREASURY ?? 'ST2Y1HES6JR37ZFVZWCPTZWEE0WG79G3Y8VV3EE29'
const CONTRACT_NAME = 'marketplace-v2'

const { address, senderKey } = await loadSignerWallet()

async function main() {
  console.log('Deployer:', address)
  console.log('Contract:', `${address}.${CONTRACT_NAME}`)

  const tx = await makeContractDeploy({
    contractName: CONTRACT_NAME,
    codeBody: source,
    senderKey,
    network: STACKS_TESTNET,
    anchorMode: AnchorMode.Any,
    fee: 500000n,
  })

  const result = await broadcastTransaction({ transaction: tx, network: STACKS_TESTNET })
  if (result.error) {
    console.error('Deploy failed:', result.error)
    process.exit(1)
  }

  const txid = result.txid
  console.log('\nDeployed marketplace-v2')
  console.log('Tx:', txid)
  console.log('Explorer:', `https://explorer.hiro.so/txid/${txid}?chain=testnet`)
  console.log('\nAdd to frontend-next/.env.local:')
  console.log(`NEXT_PUBLIC_MARKETPLACE_CONTRACT=${address}.${CONTRACT_NAME}`)
  console.log('\nOptional — set treasury after confirm:')
  console.log(`  set-treasury ${TREASURY}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
