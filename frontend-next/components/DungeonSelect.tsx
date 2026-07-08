'use client'

import { DUNGEONS, Dungeon } from '@/lib/game'
import {
  DUNGEON_ESCROW_USDCX,
  UNDERHAUL_ESCROW_USDCX,
  hasDungeonEscrow,
  hasUnderhaulEscrow,
  holdVsLockHint,
} from '@/lib/vaultGate'
import HallTileBackground from './HallTileBackground'
import { Monster, MoveIcon } from './pixel'

export default function DungeonSelect({
  energy,
  maxEnergy,
  vaultLocked,
  vaultTotal,
  vaultAvailable,
  entering,
  onEnter,
  onBack,
  onOpenVault,
}: {
  energy: number
  maxEnergy: number
  vaultLocked: string
  vaultTotal: string
  vaultAvailable: string
  entering?: boolean
  onEnter: (d: Dungeon) => void
  onBack: () => void
  onOpenVault?: () => void
}) {
  const normalOk = hasDungeonEscrow(vaultLocked)
  const underhaulOk = hasUnderhaulEscrow(vaultLocked)
  const lockedAmt = Number(vaultLocked) || 0
  const totalAmt = Number(vaultTotal) || 0
  const holdHint = holdVsLockHint(vaultTotal, vaultLocked)

  function canEnterDungeon(d: Dungeon) {
    if (d.id === 'underhaul') return underhaulOk && energy >= d.energy
    return normalOk && energy >= d.energy
  }

  function enterLabel(d: Dungeon) {
    if (d.id === 'underhaul') {
      if (!underhaulOk) return `Lock ${UNDERHAUL_ESCROW_USDCX} USDCx in Vault`
    } else if (!normalOk) {
      return `Lock ${DUNGEON_ESCROW_USDCX} USDCx in Vault`
    }
    if (energy < d.energy) return 'Not enough energy'
    return `Enter · ${d.energy}⚡`
  }

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <HallTileBackground />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        <button onClick={onBack} className="pixel-btn mb-6 px-3 py-2 font-silk text-[11px]">
          ‹ Back to Hub
        </button>

        <div className="mb-2 flex items-center gap-2 font-silk text-[11px] uppercase tracking-widest text-parchment/70">
          Combat
        </div>
        <h1 className="font-pixel text-[24px] text-gold text-shadow-pixel">Dungetron Overview</h1>
        <p className="mt-4 max-w-2xl font-silk text-[12px] leading-6 text-parchment/85">
          Dungetron is a rogue-lite combat dungeon with enemies of increasing difficulty. There are
          4 rooms to each of the 4 floors. Clear a room by defeating the enemy to receive the items
          they drop — you keep these even when you die. Once you die, your progress resets and you
          begin again from the start.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 font-silk text-[10px] text-parchment/75">
          <Legend t="sword" b="Spell" />
          <Legend t="spell" b="Guard" />
          <Legend t="shield" b="Strike" />
          <span className="label-chip px-2 py-1">Win an exchange → deal damage &amp; repair shield</span>
        </div>

        <div className="mt-4 pixel-panel flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex-1 font-silk text-[11px] leading-5 text-parchment/85">
            <span className="text-gold">FlowVault entry fees</span> — vault total{' '}
            <span className="text-gold">{vaultTotal} USDCx</span>
            {' · '}
            locked <span className="text-gold">{vaultLocked}</span>
            {' · '}
            hold <span className="text-gold">{vaultAvailable}</span>
            <span className="mt-1 block">
              Dungetron only checks <span className="text-gold">LOCK</span>, not HOLD. Normal needs{' '}
              {DUNGEON_ESCROW_USDCX} USDCx locked · Underhaul needs {UNDERHAUL_ESCROW_USDCX} USDCx locked total.
            </span>
            {holdHint && (
              <span className="mt-2 block rounded border border-hp/40 bg-hp/10 px-2 py-2 text-hp">{holdHint}</span>
            )}
            {!holdHint && !normalOk && (
              <span className="mt-1 block text-hp">
                Vault → choose <span className="text-gold">Dungeon Run Escrow</span> → Set Strategy → Deposit 2+ USDCx
                (1 locks, rest stays withdrawable).
              </span>
            )}
            {normalOk && !underhaulOk && (
              <span className="mt-1 block text-parchment/70">
                Underhaul needs {UNDERHAUL_ESCROW_USDCX} USDCx locked ({lockedAmt}/{UNDERHAUL_ESCROW_USDCX}) — use Underhaul
                Entry Vault strategy.
              </span>
            )}
          </div>
          {onOpenVault && (
            <button onClick={onOpenVault} className="pixel-btn pixel-btn-gold px-3 py-2 font-silk text-[11px]">
              Open Vault →
            </button>
          )}
        </div>

        <p className="mt-3 font-silk text-[10px] text-parchment/60">
          Energy: {energy}/{maxEnergy} · regens 10 per hour (full in 24h)
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {DUNGEONS.map((d) => {
            const canEnter = canEnterDungeon(d)
            const fee =
              d.id === 'underhaul'
                ? `${UNDERHAUL_ESCROW_USDCX} USDCx locked`
                : `${DUNGEON_ESCROW_USDCX} USDCx locked`
            return (
              <div key={d.id} className="pixel-panel overflow-hidden">
                <div className="relative grid h-40 place-items-center overflow-hidden border-b-2 border-edge bg-[#1a1410]/80">
                  <div className="relative animate-floaty" style={{ transform: 'scaleX(-1)' }}>
                    <Monster variant={d.startVariant} size={7} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-silk text-[14px] font-bold text-gold">{d.name}</div>
                  <p className="mt-2 h-14 font-silk text-[11px] leading-5 text-parchment/75">{d.desc}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 font-silk text-[10px]">
                    <span className="label-chip px-2 py-1">{d.floors} floors · {d.rooms} rooms</span>
                    <span className="label-chip px-2 py-1 text-gold">⚡ {d.energy} energy</span>
                    <span className="label-chip px-2 py-1 text-gold">Entry: {fee}</span>
                  </div>
                  <div className="mt-2 font-silk text-[10px] text-parchment/60">Rewards: {d.reward}</div>
                  <button
                    onClick={() => onEnter(d)}
                    disabled={!canEnter || entering}
                    className="pixel-btn pixel-btn-gold mt-3 w-full px-4 py-3 font-silk text-[12px]"
                  >
                    {entering ? 'Checking vault…' : enterLabel(d)}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Legend({ t, b }: { t: 'sword' | 'shield' | 'spell'; b: string }) {
  return (
    <div className="label-chip flex items-center gap-1 px-2 py-1">
      <div className="grid h-5 w-5 place-items-center">
        <MoveIcon type={t} size={2} />
      </div>
      <span className="text-parchment/50">beats</span>
      <span className="text-gold">{b}</span>
    </div>
  )
}
