'use client'

export default function ComingSoon({ title, blurb }: { title: string; blurb?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
      <div className="battle-frame max-w-md px-8 py-10 text-center">
        <div className="font-pixel text-[13px] text-gold text-shadow-pixel">{title}</div>
        <div className="mt-4 font-silk text-[11px] leading-6 text-parchment/70">
          {blurb ?? 'This area is under construction. Check back soon, hero.'}
        </div>
        <div className="mt-6 font-pixel text-[9px] text-gold">COMING SOON</div>
      </div>
    </div>
  )
}
