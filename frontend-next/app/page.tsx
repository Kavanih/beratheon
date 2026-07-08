'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import SideRail, { Screen } from '@/components/SideRail'
import { Look, NOOB_LOOK } from '@/components/Character'
import TopBar from '@/components/TopBar'
import Combat from '@/components/Combat'
import Workbench from '@/components/Workbench'
import HubWorld from '@/components/HubWorld'
import DungeonSelect from '@/components/DungeonSelect'
import Gigamarket from '@/components/Gigamarket'
import ComingSoon from '@/components/ComingSoon'
import type { Equipped, EquipSlot, InvItem } from '@/components/GearStation'
import ClaimUsernameModal from '@/components/ClaimUsernameModal'
import VaultTreasury from '@/components/VaultTreasury'
import { useWallet } from '@/context/WalletProvider'
import { Dungeon, GearItem, Listing, Loot, MATERIALS, SKINS, materialByKey, rarityOf } from '@/lib/game'
import { getEnergy, MAX_ENERGY, spendEnergy } from '@/lib/energyStorage'
import { hydrateEquipped, loadPlayerSave } from '@/lib/playerStorage'
import {
  hasDungeonEscrow,
  hasUnderhaulEscrow,
  holdVsLockHint,
  underhaulGateMessage,
  vaultGateMessage,
} from '@/lib/vaultGate'

interface Owned extends GearItem {
  qty: number
}

const SCREEN_TITLE: Record<Screen, string> = {
  hub: 'Hall of Heroes',
  dungeonselect: 'Dungetron',
  dungeon: 'The Descent',
  workbench: 'The Forge',
  gearstation: 'Gear Station',
  market: 'Gigamarket',
  vault: 'FlowVault Treasury',
  collection: 'Gear Vault',
}

const GEAR_SLOT_TARGET: Record<string, EquipSlot> = {
  head: 'headGear',
  body: 'bodyGear',
  hands: 'toolbar',
}

function buildEquipCatalog(owned: Owned[]): InvItem[] {
  const gear = owned.map((o) => ({
    id: o.id,
    name: o.name,
    sprite: o.sprite,
    rarity: o.rarity,
    target: GEAR_SLOT_TARGET[o.slot] ?? 'toolbar',
    kind: 'gear' as const,
    stats: o.stats,
  }))
  const skins: InvItem[] = SKINS.map((s) => ({
    id: s.id,
    name: s.name,
    sprite: s.sprite,
    rarity: s.rarity,
    target: s.slot === 'head' ? 'headVanity' : 'bodyVanity',
    kind: 'skin' as const,
  }))
  return [...gear, ...skins]
}

export default function Home() {
  const { address, connected, displayName, claimedUsername, claimPlayerName, hasUsernameNft, vaultSnapshot, refreshVault } =
    useWallet()
  const playerName = claimedUsername ?? displayName
  const [screen, setScreen] = useState<Screen>('hub')
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [energy, setEnergy] = useState(MAX_ENERGY)
  const maxEnergy = MAX_ENERGY
  const [gold, setGold] = useState(1250)
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([])
  const [owned, setOwned] = useState<Owned[]>([])
  const [equipped, setEquipped] = useState<Equipped>({})
  const [dungeonRunKey, setDungeonRunKey] = useState(0)
  const [enteringDungeon, setEnteringDungeon] = useState(false)

  // generous starting stockpile so the forge is immediately usable
  const [materials, setMaterials] = useState<Record<string, number>>(() => {
    const inv: Record<string, number> = {}
    for (const id of Object.keys(MATERIALS)) {
      const r = MATERIALS[id].rarity
      inv[id] = Math.max(2, 40 - r * 7)
    }
    return inv
  })

  useEffect(() => {
    setEnergy(getEnergy(address))
    const id = window.setInterval(() => setEnergy(getEnergy(address)), 60_000)
    return () => window.clearInterval(id)
  }, [address])

  useEffect(() => {
    if (connected) refreshVault().catch(() => {})
  }, [connected, refreshVault, screen])

  let toastSeq = 0
  const toast = useCallback((text: string) => {
    const id = ++toastSeq + Date.now()
    setToasts((p) => [...p, { id, text }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2600)
  }, [])

  const handleLoot = useCallback(
    (loot: Loot[]) => {
      setMaterials((prev) => {
        const next = { ...prev }
        for (const l of loot) next[l.id] = (next[l.id] ?? 0) + 1
        return next
      })
      setGold((g) => g + 25 + Math.floor(Math.random() * 40))
      toast(`Looted ${loot.map((l) => l.name).join(', ')}`)
    },
    [toast]
  )

  const handleCraft = useCallback(
    (item: GearItem, qty: number) => {
      setMaterials((prev) => {
        const next = { ...prev }
        for (const [key, need] of Object.entries(item.craftCost)) {
          const id = materialByKey(key).id
          next[id] = Math.max(0, (next[id] ?? 0) - need * qty)
        }
        return next
      })
      setOwned((prev) => {
        const existing = prev.find((o) => o.id === item.id)
        if (existing) return prev.map((o) => (o.id === item.id ? { ...o, qty: o.qty + qty } : o))
        return [...prev, { ...item, qty }]
      })
      toast(`Crafted ${item.name} ×${qty}`)
    },
    [toast]
  )

  const enterDungeon = async (d: Dungeon) => {
    if (!connected) {
      toast('Connect your Stacks wallet first — use the button in the top bar')
      return
    }
    if (enteringDungeon) return
    setEnteringDungeon(true)
    try {
      const snap = (await refreshVault().catch(() => null)) ?? vaultSnapshot
      if (d.id === 'underhaul') {
        if (!hasUnderhaulEscrow(snap?.locked)) {
          const hint = holdVsLockHint(snap?.total, snap?.locked)
          toast(hint || underhaulGateMessage(snap?.locked))
          setScreen('vault')
          return
        }
      } else if (!hasDungeonEscrow(snap?.locked)) {
        const hint = holdVsLockHint(snap?.total, snap?.locked)
        toast(hint || vaultGateMessage(snap?.locked))
        setScreen('vault')
        return
      }
      const current = getEnergy(address)
      if (current < d.energy) {
        toast(`Not enough energy — regens 10/hour (max ${maxEnergy})`)
        return
      }
      setEnergy(spendEnergy(address, d.energy))
      setDungeonRunKey((k) => k + 1)
      setScreen('dungeon')
    } finally {
      setEnteringDungeon(false)
    }
  }

  const handleBuy = useCallback(
    (l: Listing, qty: number) => {
      const cost = Math.max(1, Math.round(l.price * 50)) * qty
      if (gold < cost) {
        toast('Not enough gold')
        return
      }
      setGold((g) => g - cost)
      if (MATERIALS[l.id]) {
        setMaterials((prev) => ({ ...prev, [l.id]: (prev[l.id] ?? 0) + qty }))
      }
      toast(`Bought ${l.name} ×${qty}`)
    },
    [gold, toast]
  )

  const handleSell = useCallback(
    (id: string, qty: number) => {
      setMaterials((prev) => {
        const have = prev[id] ?? 0
        if (have < qty) return prev
        return { ...prev, [id]: have - qty }
      })
      const m = MATERIALS[id]
      const value = ((m?.rarity ?? 0) + 1) * 18 * qty
      setGold((g) => g + value)
      toast(`Sold ×${qty} for ${value}g`)
    },
    [toast]
  )

  const equipCatalog = useMemo(() => buildEquipCatalog(owned), [owned])

  useEffect(() => {
    const saved = loadPlayerSave()
    if (saved?.equipped) setEquipped(hydrateEquipped(saved.equipped, equipCatalog))
  }, [equipCatalog])

  const look: Look = useMemo(
    () => ({
      ...NOOB_LOOK,
      headSkin: equipped.headVanity?.sprite ?? null,
      bodySkin: equipped.bodyVanity?.sprite ?? null,
      headGearSprite: equipped.headGear?.sprite ?? null,
      bodyGearSprite: equipped.bodyGear?.sprite ?? null,
      handsSprite: equipped.toolbar?.sprite ?? null,
      helmet: equipped.headGear ? rarityOf(equipped.headGear.rarity).color : null,
      armor: equipped.bodyGear ? rarityOf(equipped.bodyGear.rarity).color : null,
    }),
    [equipped]
  )

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-ink">
      <SideRail
        screen={screen}
        onNavigate={setScreen}
        playerName={playerName}
        look={look}
        onNameClick={() => setNameModalOpen(true)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar energy={energy} maxEnergy={maxEnergy} gold={gold} title={SCREEN_TITLE[screen]} />

        <main className="relative flex-1 overflow-hidden">
          {screen === 'hub' && (
            <HubWorld
              playerName={playerName}
              look={look}
              onEnterDungeon={() => setScreen('dungeonselect')}
              onOpenWorkbench={() => setScreen('workbench')}
              onOpenGear={() => setScreen('gearstation')}
              onOpenMarket={() => setScreen('market')}
            />
          )}
          {screen === 'dungeonselect' && (
            <DungeonSelect
              energy={energy}
              maxEnergy={maxEnergy}
              vaultLocked={vaultSnapshot?.locked ?? '0'}
              vaultTotal={vaultSnapshot?.total ?? '0'}
              vaultAvailable={vaultSnapshot?.available ?? '0'}
              entering={enteringDungeon}
              onEnter={enterDungeon}
              onBack={() => setScreen('hub')}
              onOpenVault={() => setScreen('vault')}
            />
          )}
          {screen === 'dungeon' && (
            <Combat
              key={dungeonRunKey}
              look={look}
              playerName={claimedUsername ?? 'Hero'}
              onExit={() => setScreen('hub')}
              onLoot={handleLoot}
            />
          )}
          {screen === 'workbench' && <Workbench materials={materials} onCraft={handleCraft} />}
          {screen === 'gearstation' && (
            <ComingSoon title="Gear Station" blurb="Dress up your hero, equip loot, and repair gear — arriving in a future patch." />
          )}
          {screen === 'market' && (
            <Gigamarket
              gold={gold}
              materials={materials}
              vaultAvailable={vaultSnapshot?.available}
              onBuy={handleBuy}
              onSell={handleSell}
              onOpenVault={() => setScreen('vault')}
              onMessage={toast}
            />
          )}
          {screen === 'vault' && <VaultTreasury onMessage={toast} />}
          {screen === 'collection' && (
            <ComingSoon
              title="Gear Vault"
              blurb="Browse forged gear and material stockpiles — arriving in a future patch."
            />
          )}

          <div className="pointer-events-none absolute bottom-3 right-3 z-50 flex max-w-[min(100%,320px)] flex-col items-end gap-1.5">
            {toasts.map((t) => (
              <div
                key={t.id}
                className="pixel-panel animate-popin px-3 py-2 text-right font-silk text-[10px] text-gold"
              >
                {t.text}
              </div>
            ))}
          </div>
        </main>
      </div>

      <ClaimUsernameModal
        open={nameModalOpen}
        onClose={() => setNameModalOpen(false)}
        walletAddress={address}
        hasUsernameNft={hasUsernameNft}
        onClaim={claimPlayerName}
        onClaimed={(name, txId) => {
          toast(txId ? `Welcome, ${name}! Tx submitted.` : `Welcome, ${name}!`)
        }}
      />
    </div>
  )
}
