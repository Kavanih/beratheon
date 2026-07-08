'use client'

import type { ReactNode } from 'react'

/** Hard-edged 8-bit rail icons — no glow, integer coords only */

const ACTIVE = { c: '#c9a227', d: '#6b4423', l: '#f0d878', w: '#f0e6d2' }
const MUTED = { c: '#5c5c66', d: '#2a2a30', l: '#8a8070', w: '#6e6e78' }

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      className="crisp block"
      aria-hidden
    >
      {children}
    </svg>
  )
}

function P(active?: boolean) {
  return active ? ACTIVE : MUTED
}

export function RailBriefcase({ active }: { active?: boolean }) {
  const { c, d, l } = P(active)
  return (
    <IconWrap>
      <rect x="6" y="10" width="20" height="14" fill={d} stroke={c} strokeWidth="1" />
      <rect x="12" y="7" width="8" height="4" fill="none" stroke={c} strokeWidth="1" />
      <rect x="14" y="14" width="4" height="4" fill={l} />
    </IconWrap>
  )
}

export function RailDiamond({ active }: { active?: boolean }) {
  const { c, d, l } = P(active)
  return (
    <IconWrap>
      <polygon points="16,4 26,12 16,28 6,12" fill={d} stroke={c} strokeWidth="1" />
      <rect x="14" y="12" width="4" height="4" fill={l} />
    </IconWrap>
  )
}

export function RailChip({ active }: { active?: boolean }) {
  const { c, d } = P(active)
  return (
    <IconWrap>
      <rect x="7" y="7" width="18" height="18" fill={d} stroke={c} strokeWidth="1" />
      <rect x="10" y="10" width="12" height="12" fill="#000000" stroke={c} strokeWidth="1" />
      <rect x="13" y="13" width="6" height="6" fill={c} />
      <rect x="7" y="14" width="3" height="4" fill={c} />
      <rect x="22" y="14" width="3" height="4" fill={c} />
    </IconWrap>
  )
}

export function RailFist({ active }: { active?: boolean }) {
  const { c, d } = P(active)
  return (
    <IconWrap>
      <rect x="10" y="8" width="12" height="10" fill={d} stroke={c} strokeWidth="1" />
      <rect x="8" y="6" width="4" height="6" fill={d} stroke={c} strokeWidth="1" />
      <rect x="12" y="5" width="4" height="5" fill={d} stroke={c} strokeWidth="1" />
      <rect x="16" y="6" width="4" height="6" fill={d} stroke={c} strokeWidth="1" />
      <rect x="20" y="8" width="4" height="5" fill={d} stroke={c} strokeWidth="1" />
      <rect x="11" y="18" width="10" height="8" fill={d} stroke={c} strokeWidth="1" />
    </IconWrap>
  )
}

export function RailLink({ active }: { active?: boolean }) {
  const { c, d, l } = P(active)
  return (
    <IconWrap>
      <rect x="4" y="10" width="24" height="12" fill="none" stroke={c} strokeWidth="1" />
      <rect x="8" y="14" width="16" height="4" fill={d} stroke={c} strokeWidth="1" />
      <rect x="12" y="15" width="3" height="2" fill={l} />
      <rect x="17" y="15" width="3" height="2" fill={l} />
    </IconWrap>
  )
}

export function RailCoin({ active }: { active?: boolean }) {
  const { c, d, l } = P(active)
  return (
    <IconWrap>
      <rect x="5" y="5" width="22" height="22" fill={d} stroke={c} strokeWidth="1" />
      <rect x="13" y="13" width="6" height="6" fill={l} />
      <rect x="14" y="14" width="4" height="4" fill={d} />
    </IconWrap>
  )
}

export function RailSwords({ active }: { active?: boolean }) {
  const { c, l } = P(active)
  const h = active ? '#888888' : '#444444'
  return (
    <IconWrap>
      <rect x="6" y="22" width="10" height="2" fill={h} transform="rotate(-45 11 23)" />
      <rect x="6" y="8" width="2" height="14" fill={l} stroke={c} strokeWidth="1" transform="rotate(-45 7 15)" />
      <rect x="16" y="22" width="10" height="2" fill={h} transform="rotate(45 21 23)" />
      <rect x="23" y="8" width="2" height="14" fill={l} stroke={c} strokeWidth="1" transform="rotate(45 24 15)" />
    </IconWrap>
  )
}

export function RailHub({ active }: { active?: boolean }) {
  const { c, d, l } = P(active)
  return (
    <IconWrap>
      <rect x="8" y="14" width="16" height="12" fill={d} stroke={c} strokeWidth="1" />
      <polygon points="16,6 26,14 6,14" fill={d} stroke={c} strokeWidth="1" />
      <rect x="14" y="18" width="4" height="8" fill={l} />
    </IconWrap>
  )
}

export function RailAvatar({ look }: { look?: { accent: string } }) {
  const accent = look?.accent ?? '#c9a227'
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" shapeRendering="crispEdges" className="crisp block">
      <rect x="0" y="0" width="32" height="32" fill="#1a1410" stroke="#c9a227" strokeWidth="2" />
      <rect x="9" y="7" width="14" height="12" fill="#FFFFFF" />
      <rect x="9" y="17" width="14" height="2" fill="#B0C0CC" />
      <rect x="12" y="11" width="2" height="2" fill="#000000" />
      <rect x="18" y="11" width="2" height="2" fill="#000000" />
      <rect x="11" y="19" width="10" height="7" fill="#FFFFFF" />
      <rect x="12" y="4" width="8" height="2" fill={accent} />
    </svg>
  )
}

export function RailCrest() {
  return (
    <img
      src="/logo.png"
      alt=""
      width={28}
      height={28}
      className="crisp block h-7 w-7 object-contain"
      draggable={false}
    />
  )
}
