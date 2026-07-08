'use client'

export default function StatBar({
  value,
  max,
  kind,
}: {
  value: number
  max: number
  kind: 'hp' | 'arm'
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const fill =
    kind === 'hp'
      ? 'linear-gradient(180deg,#ff7a86,#ff4d5e 55%,#c41f30)'
      : 'linear-gradient(180deg,#9be8ff,#43d4ff 55%,#1b8fc4)'
  return (
    <div
      className="relative h-3 w-full overflow-hidden rounded-[2px] border-2 border-edge bg-[#06101a]"
      style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)' }}
    >
      <div
        className="h-full transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%`, background: fill }}
      />
      {/* segment ticks */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0 9px, rgba(0,0,0,0.45) 9px 11px)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-silk text-[9px] leading-none text-white text-shadow-pixel">
        {value} / {max}
      </div>
    </div>
  )
}
