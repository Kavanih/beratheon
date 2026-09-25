/** Hall of Heroes — tile map (palette lives in lib/theme.ts). */

import { HALL_PALETTE } from './theme'

export { HALL_PALETTE }

export const TILE = 40
export const U = TILE / 8

/** Tile legend (char → meaning) */
export const TILE_LEGEND = {
  '#': 'stone wall',
  '.': 'stone floor',
  ',': 'red carpet',
  f: 'wooden fence (solid)',
  '~': 'moss / slime channel (walkable, animated)',
  T: 'wall torch',
  S: 'sign / banner post',
  B: 'banner',
  C: 'chest',
  O: 'pot / barrel',
  G: 'gear station pad',
  W: 'workbench pad',
  P: 'portal pad',
} as const

export const HALL_MAP: string[] = [
  '##############################',
  '#............................#',
  '#..G....B......TT......B...W.#',
  '#.....######........######...#',
  '#.....#....#........#....#...#',
  '#....,,,,,,,,,,,,,,,,,,,,,,..#',
  '#....,ffffffffffffffffffff,..#',
  '#....,f~~~~~~~~~~~~~~~~~~f,..#',
  '#....,f~................~f,..#',
  '#....,f~......PP........~f,..#',
  '#....,f~......PP........~f,..#',
  '#....,f~................~f,..#',
  '#....,f~~~~~~~~~~~~~~~~~~f,..#',
  '#....,fffffffff..fffffffff,..#',
  '#....,,,,,,,,,,..,,,,,,,,,,..#',
  '#..............,,............#',
  '#..S....C......,,......O..T..#',
  '#..............,,............#',
  '#............................#',
  '##############################',
]

export const MAP_W = HALL_MAP[0].length
export const MAP_H = HALL_MAP.length

export interface Station {
  type: 'dungeon' | 'workbench' | 'gear' | 'market'
  label: string
  prompt: string
  cx: number
  cy: number
}

export const HALL_STATIONS: Station[] = [
  { type: 'dungeon', label: 'Portal', prompt: 'Enter Dungetron', cx: 14.5, cy: 9.5 },
  { type: 'workbench', label: 'Workbench', prompt: 'Open Workbench', cx: 28, cy: 2 },
  { type: 'gear', label: 'Gear Station', prompt: 'Open Gear Station', cx: 3, cy: 2 },
  { type: 'market', label: 'Gigamarket', prompt: 'Open Gigamarket', cx: 3, cy: 16 },
]

export function tileAt(cx: number, cy: number): string {
  if (cy < 0 || cy >= MAP_H || cx < 0 || cx >= MAP_W) return '#'
  return HALL_MAP[cy][cx]
}

export function isWallTile(cx: number, cy: number): boolean {
  const t = tileAt(cx, cy)
  return t === '#' || t === 'f'
}

export function tileHash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
