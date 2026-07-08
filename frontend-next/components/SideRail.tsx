'use client'

import type { ComponentType } from 'react'
import type { Look } from './Character'
import {
  RailBriefcase,
  RailChip,
  RailDiamond,
  RailFist,
  RailHub,
  RailLink,
  RailAvatar,
} from './RailIcons'

export type Screen =
  | 'hub'
  | 'dungeonselect'
  | 'dungeon'
  | 'workbench'
  | 'gearstation'
  | 'market'
  | 'vault'
  | 'collection'

const NAV: {
  id: Screen
  label: string
  Icon: ComponentType<{ active?: boolean }>
}[] = [
  { id: 'hub', label: 'Hall of Heroes', Icon: RailHub },
  { id: 'market', label: 'Gigamarket', Icon: RailDiamond },
  { id: 'vault', label: 'FlowVault', Icon: RailChip },
  { id: 'workbench', label: 'Workbench', Icon: RailFist },
  { id: 'gearstation', label: 'Gear Station', Icon: RailLink },
  { id: 'collection', label: 'Gear Vault', Icon: RailBriefcase },
]

export default function SideRail({
  screen,
  onNavigate,
  playerName = 'guest',
  look,
  onNameClick,
}: {
  screen: Screen
  onNavigate: (s: Screen) => void
  playerName?: string
  look?: Look
  onNameClick?: () => void
}) {
  const isActive = (id: Screen) =>
    screen === id || (id === 'hub' && (screen === 'dungeonselect' || screen === 'dungeon'))
  const shortName = playerName.length > 6 ? `${playerName.slice(0, 3)}…` : playerName

  return (
    <aside className="pixel-rail z-30 flex h-full w-[148px] shrink-0 flex-col bg-ink">
      <div className="mb-3 flex items-center gap-1 px-2 pt-2">
        <button
          type="button"
          onClick={() => onNavigate('hub')}
          title={playerName}
          className="shrink-0 border-0 bg-transparent p-0"
        >
          <RailAvatar look={look} />
        </button>
        <button
          type="button"
          onClick={onNameClick ?? (() => onNavigate('hub'))}
          title={onNameClick ? `${playerName} — click to manage name` : playerName}
          className="pixel-rail-name min-w-0 flex-1 truncate border border-gold bg-ink px-1.5 py-1 transition hover:border-parchment"
        >
          <span className="block truncate font-pixel text-[8px] lowercase text-parchment">{shortName}</span>
        </button>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-0 py-1">
        {NAV.map(({ id, label, Icon }) => {
          const active = isActive(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              title={label}
              className={`pixel-rail-btn group relative ${active ? 'pixel-rail-btn--active' : ''}`}
            >
              <Icon active={active} />
              <span className="pixel-rail-tip pointer-events-none absolute left-full top-1/2 z-50 ml-1 -translate-y-1/2 whitespace-nowrap border border-gold bg-ink px-2 py-1 font-pixel text-[7px] text-gold opacity-0 group-hover:opacity-100">
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
