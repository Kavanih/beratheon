'use client'

import React from 'react'

// Generic pixel-art renderer: rows of single chars mapped to colors.
// '.' (or space) = transparent.
export function PixelArt({
  rows,
  palette,
  size = 6,
  className = '',
  style,
}: {
  rows: string[]
  palette: Record<string, string>
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  const h = rows.length
  const w = Math.max(...rows.map((r) => r.length))
  const rects: React.ReactNode[] = []
  for (let y = 0; y < h; y++) {
    const row = rows[y]
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      const fill = palette[ch]
      if (!fill) continue
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />)
    }
  }
  return (
    <svg
      width={w * size}
      height={h * size}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      className={className}
      style={style}
    >
      {rects}
    </svg>
  )
}

// ----------------------------------------------------------------------------
// Hero (chibi steel knight with cyan crest)
// ----------------------------------------------------------------------------
const HERO_ROWS = [
  '.....cc.......',
  '....cccc......',
  '...oooooo.....',
  '..osssssso....',
  '..osssssso....',
  '..osffffso....',
  '..osfeefso....',
  '..osffffso....',
  '...osssso.....',
  '..obbBBbbo....',
  '.obbBBBBbbo...',
  '.oGbbbbbbGo...',
  '.o.bbbbbb.o...',
  '...oo..oo.....',
  '...ll..ll.....',
]
const HERO_PAL: Record<string, string> = {
  c: '#3ee6ff',
  o: '#0a0f16',
  s: '#c2d6e8',
  f: '#f0c9a0',
  e: '#16242f',
  b: '#2b6f8c',
  B: '#48c6e6',
  G: '#dfeaf4',
  l: '#37485a',
}

export function Hero({ size = 9, className = '' }: { size?: number; className?: string }) {
  return <PixelArt rows={HERO_ROWS} palette={HERO_PAL} size={size} className={className} />
}

// ----------------------------------------------------------------------------
// Monster (variant-tinted imp)
// ----------------------------------------------------------------------------
const MON_ROWS = [
  '...e.....e....',
  '...ee...ee....',
  '..eGGGGGGGGe..',
  '.eGGGGGGGGGGe.',
  '.eGwpGGGGwpGe.',
  '.eGwwGGGGwwGe.',
  '.eGGGGGGGGGGe.',
  '.eGGGmmmmGGGe.',
  '.eGGmTTTTmGGe.',
  '..eGGGGGGGGe..',
  '..eGGe..eGGe..',
  '..ee......ee..',
]
const MON_TINTS = ['#57b15a', '#5b6680', '#4aa3ff', '#8a5ad0', '#c23bd6']
function monPalette(variant: number): Record<string, string> {
  const g = MON_TINTS[variant % MON_TINTS.length]
  return {
    e: '#0a0f16',
    G: g,
    w: '#f2fbff',
    p: '#0a0f16',
    m: '#3a0d12',
    T: '#f2fbff',
  }
}

export function Monster({
  variant = 0,
  size = 9,
  className = '',
}: {
  variant?: number
  size?: number
  className?: string
}) {
  return (
    <PixelArt rows={MON_ROWS} palette={monPalette(variant)} size={size} className={className} />
  )
}

// ----------------------------------------------------------------------------
// Move icons (the big focal Sword / Shield / Spell)
// ----------------------------------------------------------------------------
const SWORD_ROWS = [
  '....ss....',
  '...ssBs...',
  '...sBBs...',
  '...sBBs...',
  '...sBBs...',
  '...sBBs...',
  '..ggBBgg..',
  '....hh....',
  '...hHHh...',
  '....hh....',
]
const SHIELD_ROWS = [
  '.SSSSSSSS.',
  'SccccccccS',
  'Scc.ww.ccS',
  'Sc.wwww.cS',
  'Sccwwwwccs',
  'Scc.ww.ccS',
  'Scccwwcccs',
  '.Scc..ccS.',
  '..Scc cS..',
  '...SccS...',
]
const SPELL_ROWS = [
  '....pp....',
  '...pPPp...',
  '..pPMMPp..',
  '.pPMMMMPp.',
  'pPMMllMMPp',
  'pPMMllMMPp',
  '.pPMMMMPp.',
  '..pPMMPp..',
  '...pPPp...',
  '....pp....',
]
const MOVE_PAL: Record<string, string> = {
  s: '#cfe0ee',
  B: '#eef9ff',
  g: '#ffce4a',
  h: '#6b4a2a',
  H: '#a9763f',
  S: '#1c6f8c',
  c: '#3ee6ff',
  w: '#eaffff',
  p: '#7a2bd6',
  P: '#b15cff',
  M: '#e07bff',
  l: '#fff0ff',
}

export function MoveIcon({
  type,
  size = 8,
  className = '',
}: {
  type: 'sword' | 'shield' | 'spell'
  size?: number
  className?: string
}) {
  const rows = type === 'sword' ? SWORD_ROWS : type === 'shield' ? SHIELD_ROWS : SPELL_ROWS
  return <PixelArt rows={rows} palette={MOVE_PAL} size={size} className={className} />
}

// ----------------------------------------------------------------------------
// Tiny HUD glyphs
// ----------------------------------------------------------------------------
export function Heart({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <PixelArt
      size={size / 7}
      className={className}
      palette={{ o: '#5e0d16', r: '#ff4d5e', h: '#ff9aa6' }}
      rows={['.oo.oo.', 'orrrrro', 'orhrrro', 'orrrrro', '.orrro.', '..oro..', '...o...']}
    />
  )
}

export function ArmorGlyph({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <PixelArt
      size={size / 7}
      className={className}
      palette={{ o: '#0c3a4a', a: '#43d4ff', h: '#d6f7ff' }}
      rows={['.ooooo.', 'oaaaaao', 'oahhhao', 'oaaaaao', 'oaaaaao', '.oaaao.', '..ooo..']}
    />
  )
}

export function Coin({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <PixelArt
      size={size / 7}
      className={className}
      palette={{ o: '#7a4d00', g: '#ffce4a', h: '#fff0b0' }}
      rows={['..ooo..', '.ogggo.', 'oghgggo', 'ogghggo', 'ogggggo', '.ogggo.', '..ooo..']}
    />
  )
}

export function EnergyBolt({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <PixelArt
      size={size / 7}
      className={className}
      palette={{ o: '#0a5a66', c: '#3ee6ff', h: '#e6ffff' }}
      rows={['...cco.', '..cco..', '.ccho..', 'ccccco.', '..occ..', '.occ...', '.oc....']}
    />
  )
}

export function Star({ filled = true, size = 10 }: { filled?: boolean; size?: number }) {
  return (
    <PixelArt
      size={size / 7}
      palette={{ o: '#7a5a00', s: filled ? '#ffce4a' : '#2b3a47' }}
      rows={['...o...', '..oso..', 'ossssso', '.ossso.', '.ososo.', '.o...o.', '.......']}
    />
  )
}
