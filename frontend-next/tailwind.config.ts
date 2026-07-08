import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1a1410',
        panel: '#2a2a30',
        'panel-2': '#3a3a42',
        edge: '#4a4a52',
        'edge-2': '#6b4423',
        cyan: {
          glow: '#e8c547',
          DEFAULT: '#c9a227',
          deep: '#8a6b12',
        },
        gold: '#c9a227',
        parchment: '#d4c4a8',
        hp: '#a83245',
        arm: '#e8b84a',
        common: '#8a8070',
        uncommon: '#c9a227',
        rare: '#6e6e78',
        epic: '#8b2635',
        legendary: '#c9a227',
        mythic: '#a83245',
        stone: {
          dark: '#3a3a42',
          DEFAULT: '#4a4a52',
          light: '#5c5c66',
        },
        wood: {
          dark: '#3d2814',
          DEFAULT: '#6b4423',
          light: '#a97142',
        },
        carpet: {
          DEFAULT: '#8b2635',
          dark: '#6b1d28',
        },
        slime: {
          DEFAULT: '#8a6b12',
          glow: '#e8c547',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        silk: ['Silkscreen', '"Press Start 2P"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(201,162,39,0.35), 0 0 18px rgba(201,162,39,0.18)',
        'glow-strong': '0 0 0 2px rgba(201,162,39,0.45), 0 0 22px rgba(232,184,74,0.25)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(5px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        popin: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '70%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        flash: {
          '0%,100%': { opacity: '0' },
          '50%': { opacity: '0.9' },
        },
        rise: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-42px)', opacity: '0' },
        },
        scan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 -8px' },
        },
      },
      animation: {
        floaty: 'floaty 2.6s ease-in-out infinite',
        shake: 'shake 0.4s ease-in-out',
        popin: 'popin 0.35s cubic-bezier(.2,1.4,.4,1) both',
        flash: 'flash 0.4s ease-out',
        rise: 'rise 0.9s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config
