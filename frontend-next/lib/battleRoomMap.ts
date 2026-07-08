/** Dungeon battle room — same tile legend as Hall of Heroes. */

export const BATTLE_TILE = 56

export const BATTLE_MAP: string[] = [
  '################################',
  '#..............................#',
  '#..B..........TT..........B....#',
  '#..............................#',
  '#..............................#',
  '#..O......................O....#',
  '#..............................#',
  '#..............................#',
  '#..............................#',
  '#..~........................~.#',
  '#~~~........................~~~#',
  '################################',
]

export const BATTLE_MAP_W = BATTLE_MAP[0].length
export const BATTLE_MAP_H = BATTLE_MAP.length

export function battleTileAt(cx: number, cy: number): string {
  if (cy < 0 || cy >= BATTLE_MAP_H || cx < 0 || cx >= BATTLE_MAP_W) return '#'
  return BATTLE_MAP[cy][cx]
}
