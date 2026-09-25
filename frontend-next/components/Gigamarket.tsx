'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ItemType, Listing, MARKET, MATERIALS, rarityOf } from '@/lib/game'
import { buildLocalCatalog, getMaterialForTokenId, materialMetadataUrl } from '@/lib/itemCatalog'
import { fetchOnChainInventory, type OnChainItem } from '@/lib/itemsSft'
import {
  buyMarketplaceListing,
  createMarketplaceListing,
  fetchActiveListings,
  microStxToStx,
  stxToMicro,
  type ChainListing,
} from '@/lib/marketplaceChain'
import { hiroTxUrl } from '@/lib/chainCalls'
import { useWallet } from '@/context/WalletProvider'
import { BERATHEON_CONTRACTS, marketplaceHasEscrow } from '@/lib/contracts'

const TABS: (ItemType | 'All')[] = ['All', 'Material', 'Consumable', 'Skin', 'Collectible']

export default function Gigamarket({
  gold,
  materials,
  onBuy,
  onSell,
  onChainMaterialBuy,
  onMessage,
}: {
  gold: number
  materials: Record<string, number>
  onBuy: (l: Listing, qty: number) => void
  onSell: (id: string, qty: number) => void
  onChainMaterialBuy?: (materialId: string, qty: number) => void
  onMessage?: (text: string) => void
}) {
  const { address, connected } = useWallet()
  const [tab, setTab] = useState<ItemType | 'All'>('All')
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [marketMode, setMarketMode] = useState<'chain' | 'arcade'>('chain')
  const [q, setQ] = useState('')
  const [selId, setSelId] = useState(MARKET[0]?.id ?? '1001')
  const [sellMaterialId, setSellMaterialId] = useState('1001')
  const [qty, setQty] = useState(1)
  const [chainListings, setChainListings] = useState<ChainListing[]>([])
  const [inventory, setInventory] = useState<OnChainItem[]>([])
  const [chainLoading, setChainLoading] = useState(false)
  const [chainSelId, setChainSelId] = useState<number | null>(null)
  const [listPriceStx, setListPriceStx] = useState('0.01')
  const [pending, setPending] = useState(false)

  const refreshChain = useCallback(async () => {
    setChainLoading(true)
    try {
      const [listingsResult, inventoryResult] = await Promise.allSettled([
        fetchActiveListings(),
        fetchOnChainInventory(address),
      ])

      if (listingsResult.status === 'fulfilled') {
        const rows = listingsResult.value
        setChainListings(rows)
        if (rows.length) {
          setChainSelId((prev) => (prev && rows.some((r) => r.listingId === prev) ? prev : rows[0].listingId))
        }
      } else {
        setChainListings([])
        onMessage?.(listingsResult.reason instanceof Error ? listingsResult.reason.message : 'Failed to load listings')
      }

      if (inventoryResult.status === 'fulfilled') {
        setInventory(inventoryResult.value)
      } else {
        setInventory(
          buildLocalCatalog().map((item) => ({
            ...item,
            registeredOnChain: false,
            balance: 0,
          }))
        )
      }
    } finally {
      setChainLoading(false)
    }
  }, [address, onMessage])

  useEffect(() => {
    if (marketMode === 'chain') refreshChain().catch(() => {})
  }, [marketMode, refreshChain, address])

  const arcadeList = useMemo(
    () => MARKET.filter((l) => (tab === 'All' || l.type === tab) && l.name.toLowerCase().includes(q.toLowerCase())),
    [tab, q]
  )

  const chainFiltered = useMemo(
    () => chainListings.filter((l) => (tab === 'All' || l.type === tab) && l.name.toLowerCase().includes(q.toLowerCase())),
    [chainListings, tab, q]
  )

  const catalogFiltered = useMemo(
    () => inventory.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())),
    [inventory, q]
  )

  const sel = MARKET.find((l) => l.id === selId) ?? arcadeList[0]
  const chainSel = chainFiltered.find((l) => l.listingId === chainSelId) ?? chainFiltered[0] ?? null
  const sellItem = inventory.find((i) => i.materialId === sellMaterialId) ?? catalogFiltered[0] ?? null
  const registeredCount = inventory.filter((i) => i.registeredOnChain).length

  const handleChainBuy = async () => {
    if (!connected || !address || !chainSel) {
      onMessage?.('Connect wallet to buy on-chain')
      return
    }
    setPending(true)
    try {
      const txId = await buyMarketplaceListing(address, chainSel.listingId, qty, false)
      const mat = getMaterialForTokenId(chainSel.tokenId)
      if (mat && chainSel.tokenContract === BERATHEON_CONTRACTS.itemsSft) {
        onChainMaterialBuy?.(mat.id, qty)
      }
      onMessage?.(
        marketplaceHasEscrow
          ? `Purchase submitted — ${qty}× ${chainSel.name} + ${microStxToStx(chainSel.pricePerUnitMicroStx * qty).toFixed(4)} STX`
          : `STX sent — upgrade to marketplace-v2 for on-chain item delivery`
      )
      window.open(hiroTxUrl(txId), '_blank', 'noopener,noreferrer')
      await refreshChain()
    } catch (e) {
      onMessage?.(e instanceof Error ? e.message : 'On-chain buy failed')
    } finally {
      setPending(false)
    }
  }

  const handleChainList = async () => {
    if (!connected || !address || !sellItem) {
      onMessage?.('Connect wallet and pick an item to list')
      return
    }
    if (!sellItem.registeredOnChain) {
      onMessage?.('Item not registered on items-sft yet — run backend seed:marketplace')
      return
    }
    if (sellItem.balance < qty) {
      onMessage?.(`Need ${qty} on-chain (you have ${sellItem.balance}). Ask deployer to mint items-sft.`)
      return
    }
    const micro = stxToMicro(Number(listPriceStx))
    if (!Number.isFinite(micro) || micro <= 0) {
      onMessage?.('Enter a valid STX price')
      return
    }
    setPending(true)
    try {
      const txId = await createMarketplaceListing(address, sellItem.materialId, qty, micro)
      onMessage?.(`Listing live on ${BERATHEON_CONTRACTS.marketplace}`)
      window.open(hiroTxUrl(txId), '_blank', 'noopener,noreferrer')
      onSell(sellItem.materialId, qty)
      await refreshChain()
      setMode('buy')
    } catch (e) {
      onMessage?.(e instanceof Error ? e.message : 'Create listing failed')
    } finally {
      setPending(false)
    }
  }

  const renderChainLeft = () => {
    if (mode === 'buy' && chainFiltered.length > 0) {
      return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2">
          {chainFiltered.map((l) => {
            const r = rarityOf(l.rarity)
            const active = chainSel?.listingId === l.listingId
            return (
              <button
                key={l.listingId}
                onClick={() => {
                  setChainSelId(l.listingId)
                  setQty(1)
                }}
                title={l.name}
                className={`group relative flex flex-col items-center rounded border-2 bg-[#0a1622] p-2 transition hover:-translate-y-0.5 ${active ? 'shadow-glow-strong' : ''}`}
                style={{ borderColor: active ? '#3ee6ff' : r.color, boxShadow: `inset 0 0 16px ${r.color}22` }}
              >
                <span className="absolute right-1 top-1 font-silk text-[8px] text-gold/60">#{l.listingId}</span>
                <img src={l.sprite} alt={l.name} className="h-12 w-12" />
                <span className="mt-1 font-silk text-[9px] text-gold">{microStxToStx(l.pricePerUnitMicroStx).toFixed(4)} STX</span>
              </button>
            )
          })}
        </div>
      )
    }

    return (
      <div>
        <p className="mb-2 font-silk text-[10px] text-gold/60">
          {mode === 'sell'
            ? 'On-chain inventory (items-sft). Select an item in the panel → list for STX.'
            : chainFiltered.length
              ? 'Active listings'
              : `Catalog · ${registeredCount}/${inventory.length} registered on items-sft`}
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2">
          {catalogFiltered.map((item) => {
            const r = rarityOf(item.rarity)
            const active = sellMaterialId === item.materialId
            return (
              <button
                key={item.materialId}
                onClick={() => setSellMaterialId(item.materialId)}
                title={item.name}
                className={`relative flex flex-col items-center rounded border-2 bg-[#0a1622] p-2 transition hover:-translate-y-0.5 ${active ? 'shadow-glow-strong' : ''}`}
                style={{ borderColor: active ? '#3ee6ff' : r.color }}
              >
                {!item.registeredOnChain && (
                  <span className="absolute left-1 top-1 font-silk text-[7px] text-hp">off-chain</span>
                )}
                <img src={item.sprite} alt={item.name} className="h-12 w-12" />
                <span className="mt-1 truncate font-silk text-[8px] text-gold">{item.name}</span>
                {address && (
                  <span className="font-silk text-[8px] text-gold/50">bal {item.balance}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderChainRight = () => {
    if (mode === 'buy') {
      if (!chainSel) {
        return (
          <div className="flex flex-1 flex-col gap-3 font-silk text-[11px] text-parchment/75">
            <p>No active STX listings yet.</p>
            <p>
              Switch to <span className="text-gold">Sell</span>, pick a material you hold on{' '}
              <span className="text-gold">{BERATHEON_CONTRACTS.itemsSft}</span>, and create a listing — or ask the
              deployer to run <code className="text-gold">npm run seed:marketplace</code> in <code>backend/</code>.
            </p>
          </div>
        )
      }
      return (
        <>
          <div className="flex items-center gap-3">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded border-2 bg-[#0a1622]" style={{ borderColor: rarityOf(chainSel.rarity).color }}>
              <img src={chainSel.sprite} alt={chainSel.name} className="h-14 w-14" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-silk text-[12px] font-bold text-gold">{chainSel.name}</div>
              <div className="mt-1 font-silk text-[9px] text-gold/50">Listing #{chainSel.listingId}</div>
              <div className="mt-1 font-silk text-[9px] text-gold/40">Qty: {chainSel.qty}</div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded border border-edge bg-[#0a1622] px-3 py-2 font-silk text-[10px]">
            <span className="text-gold/60">Price / unit</span>
            <span className="text-gold">{microStxToStx(chainSel.pricePerUnitMicroStx).toFixed(4)} STX</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setQty((n) => Math.max(1, n - 1))} className="pixel-btn h-8 w-8 font-silk text-[14px]">-</button>
            <div className="grid h-8 flex-1 place-items-center rounded border-2 border-edge bg-[#0a1622] font-silk text-[12px] text-gold">{qty}</div>
            <button onClick={() => setQty((n) => Math.min(chainSel.qty, n + 1))} className="pixel-btn h-8 w-8 font-silk text-[14px]">+</button>
          </div>
          <button onClick={handleChainBuy} disabled={pending || !connected} className="pixel-btn pixel-btn-gold mt-auto w-full px-4 py-3 font-silk text-[13px] disabled:opacity-50">
            {pending ? 'Confirm in wallet…' : `Buy ×${qty} with STX`}
          </button>
        </>
      )
    }

    return (
      <>
        <p className="font-silk text-[10px] leading-5 text-parchment/70">
          List on <span className="text-gold">{BERATHEON_CONTRACTS.marketplace}</span>. Requires on-chain balance on{' '}
          <span className="text-gold">{BERATHEON_CONTRACTS.itemsSft}</span>.
        </p>
        {sellItem ? (
          <>
            <div className="flex items-center gap-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded border-2 bg-[#0a1622]" style={{ borderColor: rarityOf(sellItem.rarity).color }}>
                <img src={sellItem.sprite} alt={sellItem.name} className="h-12 w-12" />
              </div>
              <div>
                <div className="font-silk text-[12px] font-bold text-gold">{sellItem.name}</div>
                <div className="font-silk text-[9px] text-gold/50">Token #{sellItem.tokenId}</div>
                <div className="font-silk text-[9px] text-gold/40">On-chain balance: {sellItem.balance}</div>
              </div>
            </div>
            <a href={sellItem.metadataUrl} target="_blank" rel="noopener noreferrer" className="truncate font-silk text-[10px] text-cyan underline">
              Metadata JSON → pin to IPFS
            </a>
            <label className="font-silk text-[10px] text-gold/60">Price per unit (STX)</label>
            <input value={listPriceStx} onChange={(e) => setListPriceStx(e.target.value)} className="rounded border border-edge bg-[#0a1622] px-2 py-2 font-silk text-[11px] text-gold" />
            <div className="flex items-center gap-2">
              <button onClick={() => setQty((n) => Math.max(1, n - 1))} className="pixel-btn h-8 w-8 font-silk text-[14px]">-</button>
              <div className="grid h-8 flex-1 place-items-center rounded border-2 border-edge bg-[#0a1622] font-silk text-[12px] text-gold">{qty}</div>
              <button onClick={() => setQty((n) => Math.min(sellItem.balance || 99, n + 1))} className="pixel-btn h-8 w-8 font-silk text-[14px]">+</button>
            </div>
            <button onClick={handleChainList} disabled={pending || !connected || sellItem.balance < qty} className="pixel-btn pixel-btn-gold mt-auto w-full px-4 py-3 font-silk text-[13px] disabled:opacity-50">
              {pending ? 'Confirm in wallet…' : `List ×${qty} on-chain`}
            </button>
          </>
        ) : (
          <p className="font-silk text-[11px] text-gold/50">Select an item from the catalog.</p>
        )}
      </>
    )
  }

  return (
    <div className="flex h-full w-full flex-col p-3">
      <div className="pixel-panel mb-3 flex flex-wrap items-center gap-2 px-4 py-2">
        <span className="mr-2 font-pixel text-[13px] text-gold text-shadow-pixel">GIGAMARKET</span>
        <button onClick={() => setMarketMode('chain')} className={`pixel-btn px-2 py-1 font-silk text-[9px] ${marketMode === 'chain' ? '!border-gold !text-white shadow-glow' : ''}`}>On-chain STX</button>
        <button onClick={() => setMarketMode('arcade')} className={`pixel-btn px-2 py-1 font-silk text-[9px] ${marketMode === 'arcade' ? '!border-gold !text-white shadow-glow' : ''}`}>Arcade gold</button>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-40 rounded border-2 border-edge bg-[#06101a] px-2 py-1 font-silk text-[10px] text-gold placeholder:text-gold/30 focus:border-gold focus:outline-none" />
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pixel-btn px-2 py-1 font-silk text-[9px] ${tab === t ? '!border-gold !text-white shadow-glow' : ''}`}>{t}</button>
        ))}
        {marketMode === 'chain' && (
          <button onClick={() => refreshChain()} className="pixel-btn px-2 py-1 font-silk text-[9px]">{chainLoading ? '…' : 'Refresh'}</button>
        )}
        <div className="ml-auto label-chip px-2 py-1 font-silk text-[10px] text-gold">$ {gold.toLocaleString()}</div>
      </div>

      {marketMode === 'chain' && (
        <div className="pixel-panel mb-3 px-4 py-2 font-silk text-[10px] text-parchment/70">
          {!marketplaceHasEscrow && (
            <p className="mb-2 text-hp">
              Legacy marketplace — buys move STX only. Deploy <span className="text-gold">marketplace-v2</span> and set{' '}
              <span className="text-gold">NEXT_PUBLIC_MARKETPLACE_CONTRACT</span> for item escrow.
            </p>
          )}
          Contracts:{' '}
          <a className="text-gold underline" href={`https://explorer.hiro.so/address/${BERATHEON_CONTRACTS.itemsSft}?chain=testnet`} target="_blank" rel="noreferrer">{BERATHEON_CONTRACTS.itemsSft}</a>
          {' · '}
          <a className="text-gold underline" href={`https://explorer.hiro.so/address/${BERATHEON_CONTRACTS.marketplace}?chain=testnet`} target="_blank" rel="noreferrer">{BERATHEON_CONTRACTS.marketplace}</a>
          {' · '}
          <a className="text-cyan underline" href={materialMetadataUrl('1001')} target="_blank" rel="noreferrer">sample metadata JSON</a>
        </div>
      )}

      <div className="grid flex-1 grid-cols-[1fr_320px] gap-3 overflow-hidden">
        <div className="pixel-panel overflow-y-auto p-3">
          {marketMode === 'chain' ? (
            chainLoading && !inventory.length ? (
              <div className="grid h-full min-h-[200px] place-items-center font-silk text-[11px] text-gold/50">Loading on-chain catalog…</div>
            ) : (
              renderChainLeft()
            )
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2">
              {arcadeList.map((l) => {
                const r = rarityOf(l.rarity)
                const active = sel?.id === l.id
                return (
                  <button key={`${l.type}-${l.id}`} onClick={() => { setSelId(l.id); setQty(1) }} title={l.name} className={`relative flex flex-col items-center rounded border-2 bg-[#0a1622] p-2 transition hover:-translate-y-0.5 ${active ? 'shadow-glow-strong' : ''}`} style={{ borderColor: active ? '#3ee6ff' : r.color }}>
                    <img src={l.sprite} alt={l.name} className="h-12 w-12" />
                    <span className="mt-1 font-silk text-[9px] text-gold">${l.price.toFixed(2)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="pixel-panel flex flex-col gap-3 p-3">
          <div className="flex gap-1">
            {(['buy', 'sell'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`pixel-btn flex-1 px-2 py-1.5 font-silk text-[10px] uppercase ${mode === m ? '!border-gold !text-white shadow-glow' : ''}`}>{m}</button>
            ))}
          </div>

          {marketMode === 'chain' ? renderChainRight() : sel ? (
            <>
              <div className="flex items-center gap-3">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded border-2 bg-[#0a1622]" style={{ borderColor: rarityOf(sel.rarity).color }}>
                  <img src={sel.sprite} alt={sel.name} className="h-14 w-14" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-silk text-[12px] font-bold text-gold">{sel.name}</div>
                  <div className="mt-1 font-silk text-[9px] text-gold/40">You own: {materials[sel.id] ?? 0}</div>
                </div>
              </div>
              {mode === 'buy' ? (
                <button onClick={() => onBuy(sel, qty)} className="pixel-btn pixel-btn-gold mt-auto w-full px-4 py-3 font-silk text-[13px]">Buy ×{qty} (gold)</button>
              ) : (
                <button disabled={(materials[sel.id] ?? 0) < qty || !MATERIALS[sel.id]} onClick={() => onSell(sel.id, qty)} className="pixel-btn mt-auto w-full px-4 py-3 font-silk text-[13px]">Sell ×{qty} (gold)</button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
