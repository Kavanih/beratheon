/**
 * Send USDCx from backend/.env wallet (STACKS_MNEMONIC or STACKS_PRIVATE_KEY).
 *
 * Usage:
 *   npm run transfer:usdcx
 *   RECIPIENT=ST2… AMOUNT=10 npm run transfer:usdcx
 */
import {
  AnchorMode,
  Pc,
  PostConditionMode,
  broadcastTransaction,
  makeContractCall,
  noneCV,
  principalCV,
  uintCV,
} from '@stacks/transactions'
import { DEFAULT_CONTRACTS, tokenToMicro } from 'flowvault-sdk'
import { loadSignerWallet } from './lib/wallet.mjs'

const recipient = process.env.RECIPIENT?.trim() ?? 'ST2Y1HES6JR37ZFVZWCPTZWEE0WG79G3Y8VV3EE29'
const amountUsdc = process.env.AMOUNT?.trim() ?? '10'

const token = DEFAULT_CONTRACTS.testnet
const tokenId = `${token.tokenContractAddress}.${token.tokenContractName}`
const assetName = process.env.USDCX_ASSET_NAME?.trim() ?? 'usdcx-token'
const amount = tokenToMicro(amountUsdc)

const { senderKey, address } = await loadSignerWallet()

console.log('From:', address)
console.log('To:', recipient)
console.log('Amount:', amountUsdc, 'USDCx')
console.log('Token:', tokenId)

try {
  const tx = await makeContractCall({
    contractAddress: token.tokenContractAddress,
    contractName: token.tokenContractName,
    functionName: 'transfer',
    functionArgs: [uintCV(amount), principalCV(address), principalCV(recipient), noneCV()],
    senderKey,
    network: 'testnet',
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [Pc.principal(address).willSendEq(amount).ft(tokenId, assetName)],
  })

  const result = await broadcastTransaction({ transaction: tx, network: 'testnet' })
  if (result.error) {
    console.error('Broadcast error:', result.error)
    if (result.reason) console.error('Reason:', result.reason)
    process.exit(1)
  }

  console.log('Tx:', result.txid)
  console.log('Explorer:', `https://explorer.hiro.so/txid/${result.txid}?chain=testnet`)
} catch (err) {
  console.error('FAIL:', err?.message ?? err)
  process.exit(1)
}
