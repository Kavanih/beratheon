/**
 * Register materials on items-sft, mint stock, and seed marketplace listings.
 *
 * Usage (deployer wallet in backend/.env):
 *   npm run seed:marketplace
 *   RECIPIENT=ST2… npm run seed:marketplace
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  AnchorMode,
  broadcastTransaction,
  contractPrincipalCV,
  fetchCallReadOnlyFunction,
  makeContractCall,
  noneCV,
  standardPrincipalCV,
  stringAsciiCV,
  uintCV,
} from '@stacks/transactions'
import { STACKS_TESTNET } from '@stacks/network'
import { loadSignerWallet } from './lib/wallet.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const itemData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend-next/lib/itemData.json'), 'utf8'))
const materials = itemData.items.materials
const MATERIAL_ORDER = Object.keys(materials).sort((a, b) => Number(a) - Number(b))

const DEPLOYER = process.env.BERATHEON_DEPLOYER ?? 'ST30PNQ7ZP471GY3BDM0XFT48EA5WC5GTQ0PG3XHR'
const itemsAddress = DEPLOYER
const itemsName = 'items-sft'
const marketAddress = DEPLOYER
const marketName = 'marketplace'

const recipient = process.env.RECIPIENT?.trim() ?? 'ST2Y1HES6JR37ZFVZWCPTZWEE0WG79G3Y8VV3EE29'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function readMeta(tokenId) {
  try {
    const res = await fetchCallReadOnlyFunction({
      contractAddress: itemsAddress,
      contractName: itemsName,
      functionName: 'get-item-metadata',
      functionArgs: [uintCV(tokenId)],
      senderAddress: itemsAddress,
      network: STACKS_TESTNET,
    })
    return res?.value?.value ?? res?.value ?? null
  } catch {
    return null
  }
}

async function broadcast(label, tx) {
  const result = await broadcastTransaction({ transaction: tx, network: 'testnet' })
  if (result.error) {
    throw new Error(`${label}: ${result.error}${result.reason ? ` (${result.reason})` : ''}`)
  }
  console.log(`${label} →`, result.txid)
  console.log(`  https://explorer.hiro.so/txid/${result.txid}?chain=testnet`)
  await sleep(25000)
  return result.txid
}

const { senderKey, address } = await loadSignerWallet()
console.log('Deployer:', address)
console.log('Mint recipient:', recipient)

// 1) Register materials
let registered = 0
for (let i = 0; i < MATERIAL_ORDER.length; i++) {
  const materialId = MATERIAL_ORDER[i]
  const tokenId = i + 1
  const m = materials[materialId]
  const existing = await readMeta(tokenId)
  if (existing) {
    console.log(`Skip register #${tokenId} ${m.name} (already on-chain)`)
    continue
  }
  const tx = await makeContractCall({
    contractAddress: itemsAddress,
    contractName: itemsName,
    functionName: 'register-item',
    functionArgs: [uintCV(1), stringAsciiCV(m.name.slice(0, 64)), noneCV()],
    senderKey,
    network: 'testnet',
    anchorMode: AnchorMode.Any,
    fee: 100000n,
  })
  await broadcast(`Register #${tokenId} ${m.name}`, tx)
  registered++
}

// 2) Mint starter stock to recipient
const mintPlan = [
  { tokenId: 1, qty: 100, label: 'Cloth' },
  { tokenId: 2, qty: 80, label: 'Leather' },
  { tokenId: 3, qty: 60, label: 'Copper Ore' },
  { tokenId: 4, qty: 40, label: 'Iron Ore' },
  { tokenId: 5, qty: 30, label: 'Wool' },
]

for (const row of mintPlan) {
  const tx = await makeContractCall({
    contractAddress: itemsAddress,
    contractName: itemsName,
    functionName: 'mint',
    functionArgs: [uintCV(row.tokenId), standardPrincipalCV(recipient), uintCV(row.qty)],
    senderKey,
    network: 'testnet',
    anchorMode: AnchorMode.Any,
    fee: 100000n,
  })
  await broadcast(`Mint ${row.qty}× #${row.tokenId} ${row.label} → ${recipient.slice(0, 8)}…`, tx)
}

// 3) Seed marketplace listings (seller = deployer minted items on recipient; listings from recipient need their key)
// List from deployer after minting listing qty to deployer for demo buys
const listPlan = [
  { tokenId: 1, qty: 25, priceMicro: 10000, label: 'Cloth' },
  { tokenId: 2, qty: 15, priceMicro: 15000, label: 'Leather' },
  { tokenId: 3, qty: 10, priceMicro: 20000, label: 'Copper Ore' },
]

for (const row of listPlan) {
  await broadcast(
    `Mint ${row.qty}× #${row.tokenId} to deployer for listing`,
    await makeContractCall({
      contractAddress: itemsAddress,
      contractName: itemsName,
      functionName: 'mint',
      functionArgs: [uintCV(row.tokenId), standardPrincipalCV(address), uintCV(row.qty)],
      senderKey,
      network: 'testnet',
      anchorMode: AnchorMode.Any,
      fee: 100000n,
    })
  )
}

const tipRes = await fetch('https://api.testnet.hiro.so/extended/v2/blocks?limit=1')
const tipJson = await tipRes.json()
const height = tipJson.results?.[0]?.height ?? 0
const expires = height + 1440

for (const row of listPlan) {
  const tx = await makeContractCall({
    contractAddress: marketAddress,
    contractName: marketName,
    functionName: 'create-listing',
    functionArgs: [
      contractPrincipalCV(itemsAddress, itemsName),
      uintCV(row.tokenId),
      uintCV(row.qty),
      uintCV(row.priceMicro),
      uintCV(expires),
    ],
    senderKey,
    network: 'testnet',
    anchorMode: AnchorMode.Any,
    fee: 120000n,
  })
  await broadcast(`List #${row.tokenId} ${row.label} @ ${row.priceMicro / 1e6} STX`, tx)
}

console.log('\nDone. Refresh Gigamarket → On-chain STX tab.')
console.log('Metadata JSON: http://localhost:3000/metadata/items/1001.json')
