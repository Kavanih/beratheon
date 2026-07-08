'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Combatant,
  EnemyDef,
  ENEMIES,
  Loot,
  MoveType,
  MOVE_TYPES,
  beats,
  enemyToCombatant,
  makeHero,
  rarityOf,
  rollLoot,
} from '@/lib/game'
import { Look } from './Character'
import BattleArena from './combat/BattleArena'
import BattleBackground from './combat/BattleBackground'
import BattleHud from './combat/BattleHud'
import CardHand from './combat/CardHand'

type Phase = 'choose' | 'reveal' | 'won' | 'lost'
type Outcome = 'win' | 'lose' | 'tie'

interface Fx {
  id: number
  text: string
  tone: 'dmg' | 'block' | 'miss'
}

const ROOMS_PER_FLOOR = 3
let fxSeq = 0

function scaledEnemy(floor: number, index: number): EnemyDef {
  const base = ENEMIES[(index + floor) % ENEMIES.length]
  const mult = 1 + (floor - 1) * 0.25
  return {
    ...base,
    level: Math.round(base.level + (floor - 1) * 4),
    hp: Math.round(base.hp * mult),
    armor: Math.round(base.armor * mult),
    moves: {
      sword: { ...base.moves.sword, atk: Math.round(base.moves.sword.atk * mult) },
      shield: { ...base.moves.shield, def: Math.round(base.moves.shield.def * mult) },
      spell: { ...base.moves.spell, atk: Math.round(base.moves.spell.atk * mult) },
    },
  }
}

export default function Combat({
  onExit,
  onLoot,
  look,
  playerName = 'Hero',
}: {
  onExit: () => void
  onLoot: (loot: Loot[]) => void
  look: Look
  playerName?: string
}) {
  const [hero, setHero] = useState<Combatant>(() => makeHero(playerName))
  const [floor, setFloor] = useState(1)
  const [room, setRoom] = useState(1)
  const [enemy, setEnemy] = useState<Combatant>(() => enemyToCombatant(scaledEnemy(1, 0)))
  const [loot, setLoot] = useState<Loot[]>(() => rollLoot(1))

  const [phase, setPhase] = useState<Phase>('choose')
  const [heroPick, setHeroPick] = useState<MoveType | null>(null)
  const [enemyPick, setEnemyPick] = useState<MoveType | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [heroFx, setHeroFx] = useState<Fx[]>([])
  const [enemyFx, setEnemyFx] = useState<Fx[]>([])
  const [heroHit, setHeroHit] = useState(false)
  const [enemyHit, setEnemyHit] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [turn, setTurn] = useState(1)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const after = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
  }, [])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const pushFx = (side: 'hero' | 'enemy', text: string, tone: Fx['tone']) => {
    const fx = { id: ++fxSeq, text, tone }
    const setter = side === 'hero' ? setHeroFx : setEnemyFx
    setter((p) => [...p, fx])
    after(900, () => setter((p) => p.filter((f) => f.id !== fx.id)))
  }

  const aiPick = (c: Combatant): MoveType => {
    const avail = MOVE_TYPES.filter((m) => c.moves[m].charges > 0)
    const pool = avail.length ? avail : MOVE_TYPES
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const spendCharges = (c: Combatant, used: MoveType): Combatant => {
    const moves = { ...c.moves }
    for (const m of MOVE_TYPES) {
      const mv = { ...moves[m] }
      if (m === used) mv.charges = Math.max(0, mv.charges - 1)
      else mv.charges = Math.min(mv.maxCharges, mv.charges + 1)
      moves[m] = mv
    }
    return { ...c, moves }
  }

  const applyDamage = (c: Combatant, dmg: number): Combatant => {
    let armor = c.armor
    let hp = c.hp
    const absorbed = Math.min(armor, dmg)
    armor -= absorbed
    hp = Math.max(0, hp - (dmg - absorbed))
    return { ...c, armor, hp }
  }

  const play = useCallback(
    (pick: MoveType) => {
      if (phase !== 'choose') return
      if (hero.moves[pick].charges <= 0) return
      const ePick = aiPick(enemy)
      setHeroPick(pick)
      setEnemyPick(ePick)

      let result: Outcome = 'tie'
      if (beats(pick, ePick)) result = 'win'
      else if (beats(ePick, pick)) result = 'lose'
      setOutcome(result)
      setPhase('reveal')

      after(720, () => {
        let h = spendCharges(hero, pick)
        let e = spendCharges(enemy, ePick)
        h = { ...h, armor: Math.min(h.maxArmor, h.armor + hero.moves[pick].def) }
        e = { ...e, armor: Math.min(e.maxArmor, e.armor + enemy.moves[ePick].def) }

        const heroAtk = hero.moves[pick].atk
        const enemyAtk = enemy.moves[ePick].atk

        if (result === 'win') {
          e = applyDamage(e, heroAtk)
          pushFx('enemy', `-${heroAtk}`, 'dmg')
          setEnemyHit(true)
          after(380, () => setEnemyHit(false))
        } else if (result === 'lose') {
          h = applyDamage(h, enemyAtk)
          pushFx('hero', `-${enemyAtk}`, 'dmg')
          setHeroHit(true)
          after(380, () => setHeroHit(false))
        } else {
          e = applyDamage(e, heroAtk)
          h = applyDamage(h, enemyAtk)
          pushFx('enemy', `-${heroAtk}`, 'dmg')
          pushFx('hero', `-${enemyAtk}`, 'dmg')
          setEnemyHit(true)
          setHeroHit(true)
          after(380, () => {
            setEnemyHit(false)
            setHeroHit(false)
          })
        }

        setHero(h)
        setEnemy(e)
        setTurn((t) => t + 1)

        after(560, () => {
          if (e.hp <= 0) {
            onLoot(loot)
            setBanner('ROOM CLEARED')
            setPhase('won')
          } else if (h.hp <= 0) {
            setBanner('DEFEATED')
            setPhase('lost')
          } else {
            setHeroPick(null)
            setEnemyPick(null)
            setOutcome(null)
            setPhase('choose')
          }
        })
      })
    },
    [phase, hero, enemy, loot, after, onLoot]
  )

  const nextRoom = () => {
    const cleared = room >= ROOMS_PER_FLOOR
    const nFloor = cleared ? floor + 1 : floor
    const nRoom = cleared ? 1 : room + 1
    setFloor(nFloor)
    setRoom(nRoom)
    setEnemy(enemyToCombatant(scaledEnemy(nFloor, nRoom - 1)))
    setLoot(rollLoot(nFloor))
    setHero((h) => ({
      ...h,
      hp: Math.min(h.maxHp, h.hp + 4),
      armor: h.maxArmor,
      moves: {
        sword: { ...h.moves.sword, charges: h.moves.sword.maxCharges },
        shield: { ...h.moves.shield, charges: h.moves.shield.maxCharges },
        spell: { ...h.moves.spell, charges: h.moves.spell.maxCharges },
      },
    }))
    setBanner(null)
    setHeroPick(null)
    setEnemyPick(null)
    setOutcome(null)
    setPhase('choose')
  }

  const retry = () => {
    setHero(makeHero(playerName))
    setFloor(1)
    setRoom(1)
    setEnemy(enemyToCombatant(scaledEnemy(1, 0)))
    setLoot(rollLoot(1))
    setBanner(null)
    setHeroPick(null)
    setEnemyPick(null)
    setOutcome(null)
    setPhase('choose')
  }

  const outcomeLabel =
    outcome && phase === 'reveal'
      ? outcome === 'win'
        ? 'HIT!'
        : outcome === 'lose'
          ? 'BLOCK'
          : 'CLASH'
      : null

  return (
    <div className="battle-shell relative h-full w-full overflow-hidden">
      <BattleBackground />

      <div className="relative z-10 grid h-full w-full grid-rows-[auto_1fr_auto]">
      <BattleHud
        hero={hero}
        enemy={enemy}
        floor={floor}
        room={room}
        roomsPerFloor={ROOMS_PER_FLOOR}
        turn={turn}
        look={look}
      />

      <BattleArena
        look={look}
        enemyVariant={enemy.variant}
        loot={loot}
        heroHit={heroHit}
        enemyHit={enemyHit}
        heroFx={heroFx}
        enemyFx={enemyFx}
        heroPick={heroPick}
        enemyPick={enemyPick}
        showPick={phase !== 'choose'}
        outcomeLabel={outcomeLabel}
      />

      <div className="relative z-20 mb-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3 px-2 pb-2 pt-2">
        <CardHand
          moves={hero.moves}
          activePick={heroPick}
          disabled={phase !== 'choose'}
          onPlay={play}
        />
        <div className="battle-frame mb-3 grid h-14 w-14 place-items-center bg-ink/80">
          <span className="font-silk text-[9px] text-parchment/50">LOOT</span>
        </div>
        <CardHand moves={enemy.moves} activePick={enemyPick} readonly mirror />
      </div>
      </div>

      {(phase === 'won' || phase === 'lost') && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/75">
          <div className="battle-frame flex w-[320px] flex-col items-center gap-4 p-6">
            <div
              className="font-pixel text-[18px] text-shadow-pixel"
              style={{ color: phase === 'won' ? '#c9a227' : '#a83245' }}
            >
              {banner}
            </div>
            {phase === 'won' ? (
              <>
                <div className="font-silk text-[10px] text-parchment/80">LOOT SECURED</div>
                <div className="flex gap-2">
                  {loot.map((l, i) => (
                    <div
                      key={i}
                      className="battle-frame grid h-12 w-12 place-items-center bg-ink"
                      style={{ borderColor: rarityOf(l.rarity).color }}
                    >
                      <img src={l.sprite} alt={l.name} className="crisp h-9 w-9" />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={nextRoom} className="pixel-btn pixel-btn-gold w-full px-4 py-2 font-silk text-[12px]">
                  {room >= ROOMS_PER_FLOOR ? `Descend → Floor ${floor + 1}` : 'Next Room →'}
                </button>
                <button type="button" onClick={onExit} className="pixel-btn w-full px-4 py-2 font-silk text-[11px]">
                  Bank Loot &amp; Exit
                </button>
              </>
            ) : (
              <>
                <div className="font-silk text-[10px] text-parchment/70">
                  Reached Floor {floor}, Room {room}
                </div>
                <button type="button" onClick={retry} className="pixel-btn pixel-btn-gold w-full px-4 py-2 font-silk text-[12px]">
                  Retry Dungeon
                </button>
                <button type="button" onClick={onExit} className="pixel-btn w-full px-4 py-2 font-silk text-[11px]">
                  Exit to Hub
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
