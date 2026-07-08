import itemData from './itemData.json'
import spriteManifest from './sprites.json'

// ----------------------------------------------------------------------------
// Rarity
// ----------------------------------------------------------------------------
export const RARITY = [
  { name: 'Common', color: '#9aa6b2', cls: 'common' },
  { name: 'Uncommon', color: '#41d97a', cls: 'uncommon' },
  { name: 'Rare', color: '#4aa3ff', cls: 'rare' },
  { name: 'Epic', color: '#b15cff', cls: 'epic' },
  { name: 'Legendary', color: '#ff9d29', cls: 'legendary' },
  { name: 'Mythic', color: '#ff4df0', cls: 'mythic' },
] as const

export const rarityOf = (n: number) => RARITY[Math.max(0, Math.min(RARITY.length - 1, n))]

// ----------------------------------------------------------------------------
// Sprites
// ----------------------------------------------------------------------------
const manifest = spriteManifest as Record<string, string[]>
export const spriteFor = (category: string, id: string | number) => `/${category}/${id}.png`

// ----------------------------------------------------------------------------
// Materials
// ----------------------------------------------------------------------------
export interface Material {
  id: string
  name: string
  rarity: number
  sprite: string
}

const rawMaterials = (itemData as any).items.materials as Record<string, any>
export const MATERIALS: Record<string, Material> = {}
for (const id of Object.keys(rawMaterials)) {
  const m = rawMaterials[id]
  MATERIALS[id] = { id, name: m.name, rarity: m.rarity, sprite: spriteFor('materials', id) }
}

// craftCost uses keys like "cloth", "leather", "copperOre" -> map them to material ids
const KEY_TO_ID: Record<string, string> = {
  cloth: '1001',
  leather: '1002',
  copperOre: '1003',
  ironOre: '1004',
  wool: '1005',
  feather: '1006',
  silk: '1007',
  steel: '1008',
  moonstone: '1009',
  essence: '1010',
  dragonScale: '1011',
  gem: '1012',
  obsidian: '1013',
  starShard: '1014',
  voidShard: '1015',
  mithril: '1016',
  eternalShard: '1017',
  herb: '1005', // fallback sprite
}

export const materialByKey = (key: string): Material => {
  const id = KEY_TO_ID[key]
  if (id && MATERIALS[id]) {
    // herb keeps its own friendly name
    if (key === 'herb') return { ...MATERIALS[id], name: 'Herb' }
    return MATERIALS[id]
  }
  return { id: key, name: key, rarity: 0, sprite: '/stubs/4001.png' }
}

// ----------------------------------------------------------------------------
// Gear (workbench grid) — merges real ITEM_DATA with every available sprite
// ----------------------------------------------------------------------------
export type GearSlot = 'head' | 'body' | 'hands'

export interface GearItem {
  id: string
  slot: GearSlot
  name: string
  rarity: number
  sprite: string
  stats: Record<string, number>
  craftCost: Record<string, number>
}

const SLOT_NOUNS: Record<GearSlot, string[]> = {
  head: ['Cap', 'Helm', 'Crown', 'Hood', 'Visor', 'Mask'],
  body: ['Tunic', 'Plate', 'Armor', 'Robe', 'Cuirass', 'Aegis'],
  hands: ['Gloves', 'Gauntlets', 'Grips', 'Bracers', 'Claws', 'Fists'],
}
const RARITY_ADJ = ['Worn', 'Sturdy', 'Honed', 'Mystic', 'Radiant', 'Eternal']
const MAT_BY_RARITY = [
  ['cloth', 'leather'],
  ['leather', 'copperOre'],
  ['ironOre', 'steel'],
  ['steel', 'moonstone', 'essence'],
  ['dragonScale', 'gem', 'essence'],
  ['mithril', 'eternalShard', 'voidShard'],
]

function synthGear(slot: GearSlot, id: string): GearItem {
  const num = parseInt(id, 10)
  const rarity = Math.max(0, Math.min(5, Math.floor((num % 100) / 10)))
  const variant = num % 10
  const noun = SLOT_NOUNS[slot][variant % SLOT_NOUNS[slot].length]
  const name = `${RARITY_ADJ[rarity]} ${noun}`
  const def = 2 + rarity * 3 + variant
  const stats: Record<string, number> = { def }
  if (slot === 'hands') stats.dodge = 1 + rarity
  if (slot === 'head') stats.magic = rarity
  const mats = MAT_BY_RARITY[rarity]
  const craftCost: Record<string, number> = {}
  mats.forEach((m, i) => (craftCost[m] = Math.max(1, 6 - i * 2 + rarity)))
  return { id, slot, name, rarity, sprite: spriteFor(slot, id), stats, craftCost }
}

function buildGear(): GearItem[] {
  const out: GearItem[] = []
  const slots: GearSlot[] = ['head', 'body', 'hands']
  for (const slot of slots) {
    const real = (itemData as any).items[slot] as Record<string, any>
    for (const id of manifest[slot] ?? []) {
      const r = real?.[id]
      if (r) {
        out.push({
          id,
          slot,
          name: r.name,
          rarity: r.rarity,
          sprite: spriteFor(slot, id),
          stats: r.stats ?? {},
          craftCost: r.craftCost ?? {},
        })
      } else {
        out.push(synthGear(slot, id))
      }
    }
  }
  return out
}

export const GEAR: GearItem[] = buildGear()

// ----------------------------------------------------------------------------
// Combat: rock–paper–scissors moves
// ----------------------------------------------------------------------------
export type MoveType = 'sword' | 'shield' | 'spell'
export const MOVE_TYPES: MoveType[] = ['sword', 'shield', 'spell']

export const MOVE_META: Record<MoveType, { label: string; rarity: number }> = {
  sword: { label: 'Strike', rarity: 1 },
  shield: { label: 'Guard', rarity: 0 },
  spell: { label: 'Spell', rarity: 3 },
}

export interface Move {
  atk: number
  def: number
  charges: number
  maxCharges: number
}
export type MoveSet = Record<MoveType, Move>

// sword > spell, spell > shield, shield > sword
export function beats(a: MoveType, b: MoveType): boolean {
  return (
    (a === 'sword' && b === 'spell') ||
    (a === 'spell' && b === 'shield') ||
    (a === 'shield' && b === 'sword')
  )
}

export interface Combatant {
  name: string
  level: number
  hp: number
  maxHp: number
  armor: number
  maxArmor: number
  moves: MoveSet
  variant: number // visual tint for monsters; -1 = hero
}

const mv = (atk: number, def: number, max: number): Move => ({
  atk,
  def,
  charges: max,
  maxCharges: max,
})

export function makeHero(name = 'Hero'): Combatant {
  return {
    name: name.toUpperCase(),
    level: 72,
    hp: 19,
    maxHp: 19,
    armor: 5,
    maxArmor: 21,
    variant: -1,
    moves: {
      sword: mv(22, 13, 3),
      shield: mv(10, 4, 4),
      spell: mv(5, 2, 2),
    },
  }
}

export interface EnemyDef {
  name: string
  level: number
  hp: number
  armor: number
  variant: number
  moves: MoveSet
}

export const ENEMIES: EnemyDef[] = [
  {
    name: 'Forest Robe',
    level: 8,
    hp: 15,
    armor: 5,
    variant: 0,
    moves: { sword: mv(5, 5, 3), shield: mv(5, 10, 3), spell: mv(5, 3, 2) },
  },
  {
    name: 'Black Knight',
    level: 24,
    hp: 6,
    armor: 4,
    variant: 1,
    moves: { sword: mv(9, 6, 3), shield: mv(4, 8, 3), spell: mv(5, 2, 2) },
  },
  {
    name: 'Azure Aetherion',
    level: 25,
    hp: 20,
    armor: 6,
    variant: 2,
    moves: { sword: mv(8, 5, 3), shield: mv(6, 12, 3), spell: mv(10, 4, 3) },
  },
  {
    name: 'Crypt Warden',
    level: 31,
    hp: 24,
    armor: 10,
    variant: 3,
    moves: { sword: mv(11, 7, 3), shield: mv(5, 14, 3), spell: mv(7, 3, 2) },
  },
  {
    name: 'Void Aetherion',
    level: 50,
    hp: 30,
    armor: 14,
    variant: 4,
    moves: { sword: mv(14, 9, 3), shield: mv(8, 16, 3), spell: mv(13, 6, 3) },
  },
]

export function enemyToCombatant(e: EnemyDef): Combatant {
  return {
    name: e.name,
    level: e.level,
    hp: e.hp,
    maxHp: e.hp,
    armor: e.armor,
    maxArmor: e.armor + 6,
    variant: e.variant,
    moves: JSON.parse(JSON.stringify(e.moves)),
  }
}

// Loot table shown floating at the top of the dungeon room
export interface Loot {
  kind: 'material' | 'consumable'
  id: string
  name: string
  sprite: string
  rarity: number
}

export function rollLoot(floor: number): Loot[] {
  const pool: Loot[] = []
  const matIds = Object.keys(MATERIALS)
  const consumIds = (manifest['consumables'] ?? [])
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
  const count = 2 + (Math.random() < 0.5 ? 1 : 0)
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.7) {
      const id = pick(matIds)
      const m = MATERIALS[id]
      pool.push({ kind: 'material', id, name: m.name, sprite: m.sprite, rarity: m.rarity })
    } else {
      const id = pick(consumIds)
      const c = (itemData as any).items.consumables?.[id]
      pool.push({
        kind: 'consumable',
        id,
        name: c?.name ?? `Item ${id}`,
        sprite: spriteFor('consumables', id),
        rarity: c?.rarity ?? Math.min(5, Math.floor(floor / 2)),
      })
    }
  }
  return pool
}

// ----------------------------------------------------------------------------
// Item taxonomy (from the Gigaverse docs)
// ----------------------------------------------------------------------------
export type ItemType = 'Material' | 'Consumable' | 'Skin' | 'Collectible' | 'Gear'

export const ITEM_TYPE_DESC: Record<ItemType, string> = {
  Material: 'Items used for skill leveling and crafting',
  Consumable: 'Items used to provide boosts in combat',
  Skin: 'Cosmetics used to distinguish yourself',
  Collectible: 'May or may not have special uses in-game',
  Gear: 'Items with utility',
}

// ----------------------------------------------------------------------------
// Consumables
// ----------------------------------------------------------------------------
export interface Consumable {
  id: string
  name: string
  rarity: number
  sprite: string
  effect: string
  value: number
  desc: string
}
const rawConsum = (itemData as any).items.consumables as Record<string, any>
export const CONSUMABLES: Record<string, Consumable> = {}
for (const id of manifest['consumables'] ?? []) {
  const c = rawConsum?.[id] ?? {}
  CONSUMABLES[id] = {
    id,
    name: c.name ?? `Consumable ${id}`,
    rarity: c.rarity ?? 0,
    sprite: spriteFor('consumables', id),
    effect: c.effect ?? 'boost',
    value: c.value ?? 0,
    desc: c.effect
      ? `${c.effect}${c.value ? ` +${c.value}` : ''}${c.duration ? ` for ${c.duration}s` : ''}`
      : 'A useful brew to take into the dungeon.',
  }
}

// ----------------------------------------------------------------------------
// Skins (cosmetic) — match the generated skins atlas order
// ----------------------------------------------------------------------------
export interface Skin {
  id: string
  name: string
  rarity: number
  sprite: string
  slot: 'head' | 'body'
}
const SKIN_DEFS: [string, number, 'head' | 'body'][] = [
  ['Goblin', 1, 'head'],
  ['Crimson Impkin', 3, 'body'],
  ['Frost Wolf', 2, 'head'],
  ['Bat Demon', 3, 'head'],
  ['Golden Lion', 4, 'body'],
  ['Wraith Skull', 4, 'head'],
  ['Slimekin', 1, 'body'],
  ['Phoenix', 5, 'head'],
]
export const SKINS: Skin[] = (manifest['skins'] ?? []).map((id, i) => {
  const [name, rarity, slot] = SKIN_DEFS[i] ?? [`Skin ${id}`, 0, 'head']
  return { id, name, rarity, sprite: spriteFor('skins', id), slot }
})

// ----------------------------------------------------------------------------
// Collectibles
// ----------------------------------------------------------------------------
export interface Collectible {
  id: string
  name: string
  rarity: number
  sprite: string
  desc: string
}
const COLLECT_DEFS: [string, number, string][] = [
  ['Champion Trophy', 3, 'Awarded for clearing a full dungeon floor.'],
  ['Rune Tablet', 2, 'An ancient tablet humming with arcane code.'],
  ['Dragon Egg', 4, 'It feels warm. Something stirs within.'],
  ['Ancient Medallion', 3, 'A relic of the old Beratheon kingdom.'],
  ['Void Orb', 5, 'A swirling fragment of the void itself.'],
]
export const COLLECTIBLES: Collectible[] = (manifest['collectibles'] ?? []).map((id, i) => {
  const [name, rarity, desc] = COLLECT_DEFS[i] ?? [`Relic ${id}`, 0, '']
  return { id, name, rarity, sprite: spriteFor('collectibles', id), desc }
})

// ----------------------------------------------------------------------------
// Dungeons
// ----------------------------------------------------------------------------
export interface Dungeon {
  id: string
  name: string
  desc: string
  energy: number
  unlock?: string
  rooms: number
  floors: number
  reward: string
  startVariant: number
  locked: boolean
}
export const DUNGEONS: Dungeon[] = [
  {
    id: 'd5000',
    name: 'Dungetron 5000: Normal',
    desc: 'A rogue-lite combat dungeon with enemies of increasing difficulty. 4 rooms across 4 floors. Keep dropped items even when you die.',
    energy: 40,
    rooms: 4,
    floors: 4,
    reward: 'Dungeon Scrap + items, materials & skins',
    startVariant: 0,
    locked: false,
  },
  {
    id: 'underhaul',
    name: 'Dungetron: Underhaul',
    desc: 'A deeper, deadlier descent. Combat works the same, but the stakes — and the rewards — run higher.',
    energy: 40,
    rooms: 4,
    floors: 4,
    reward: 'Giga Shards + rarer drops',
    startVariant: 3,
    locked: false,
  },
]

// ----------------------------------------------------------------------------
// Gigamarket listings
// ----------------------------------------------------------------------------
export interface Listing {
  type: ItemType
  id: string
  name: string
  sprite: string
  rarity: number
  price: number // in USD
  listed: number
}
const seeded = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return (h % 1000) / 1000
}
function priceFor(rarity: number, id: string) {
  const base = [0.1, 0.4, 1.2, 4, 18, 90][Math.min(5, rarity)]
  return +(base * (0.5 + seeded(id) * 1.6)).toFixed(2)
}
export function buildMarket(): Listing[] {
  const out: Listing[] = []
  for (const id of Object.keys(MATERIALS)) {
    const m = MATERIALS[id]
    out.push({ type: 'Material', id, name: m.name, sprite: m.sprite, rarity: m.rarity, price: priceFor(m.rarity, id), listed: 1 + Math.floor(seeded(id) * 40) })
  }
  for (const c of Object.values(CONSUMABLES)) {
    out.push({ type: 'Consumable', id: c.id, name: c.name, sprite: c.sprite, rarity: c.rarity, price: priceFor(c.rarity, c.id), listed: 1 + Math.floor(seeded(c.id) * 30) })
  }
  for (const s of SKINS) {
    out.push({ type: 'Skin', id: s.id, name: s.name, sprite: s.sprite, rarity: s.rarity, price: priceFor(s.rarity + 1, s.id) * 6, listed: 1 + Math.floor(seeded(s.id) * 10) })
  }
  for (const c of COLLECTIBLES) {
    out.push({ type: 'Collectible', id: c.id, name: c.name, sprite: c.sprite, rarity: c.rarity, price: priceFor(c.rarity + 1, c.id) * 8, listed: 1 + Math.floor(seeded(c.id) * 6) })
  }
  return out
}
export const MARKET: Listing[] = buildMarket()
