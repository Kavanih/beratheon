'use client'

/** Vector shield crest — Beratheon's brand mark. Replaces the mismatched placeholder logo.png. */
export default function BrandCrest({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      className="crisp block"
      role="img"
      aria-label="Beratheon"
    >
      <polygon points="6,4 26,4 26,16 16,30 6,16" fill="#3d2814" stroke="#c9a227" strokeWidth="2" />
      <polygon points="8,6 24,6 24,15 16,27 8,15" fill="none" stroke="#6b4423" strokeWidth="1" />
      <circle cx="9" cy="7" r="1.2" fill="#f0d878" />
      <circle cx="23" cy="7" r="1.2" fill="#f0d878" />
      <text x="17" y="21" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="13" fill="#6b1d28">
        B
      </text>
      <text x="16" y="20" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="13" fill="#f0d878">
        B
      </text>
    </svg>
  )
}
