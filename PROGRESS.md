# Beratheon — Progress & Context

Living doc. Read this first in any new session before touching the code — it exists so we don't
re-derive context (and burn tokens) every time. Append to it as work happens; don't let it go stale.

## What this is

Pixel dungeon RPG on Stacks (`frontend-next/`, Next.js + Tailwind + Canvas rendering). Won the
FlowVault Builder Bounty with it (2026-09-08ish). Repo was briefly lost in Trash, restored
2026-09-23 to `~/Videos/Screencasts/beratheon` (original path was `~/Videos/Screencasts/beratheon`,
not a typo — that's just where it lives).

Current direction (as of 2026-09-24): the bounty's done, focus shifted to making the actual game UI
"top-tier" — studying **Gigaverse** (gigaverse.io) as the north-star competitor, and pulling
individual *techniques* (not literal assets/colors) from other well-built references when they fit.

## Working conventions established this thread

- **One thing at a time.** Don't batch unrelated fixes into one pass unless explicitly told to "go
  ahead with everything." Confirm direction before big/irreversible changes (full deletions, palette
  swaps, dependency removal).
- **Inspired by, not cloned.** When referencing Gigaverse or any other project's UI: adapt the
  *technique* (layout pattern, color-layering method, interaction mechanic) using Beratheon's own
  palette/assets. Never copy their literal hex values, art, or copy verbatim — IP risk, and it's not
  our identity anyway.
- **Verify live before calling something done.** Start the dev server, actually look at the screen in
  the browser (Claude-in-Chrome), don't just trust a code read. `cd frontend-next && npm run dev`
  (usually lands on :3000, sometimes bumps to :3002 if something else is already running — check the
  log). Kill with `pkill -f "next dev"` when done with a session, restart as needed.
- **No emoji in frontend code** (UI text, comments, console logs) — global user rule. Found and
  removed several instances already (Gear Station resource chips, dungeon energy label).
- Type-check after every edit pass: `cd frontend-next && npx tsc --noEmit`.
- Don't connect a real wallet / sign anything from automation — browser-safety boundary, not a
  Beratheon-specific rule.

## Design language (current)

- Palette: dark dungeon `ink` (#1a1410) background, `gold` (#c9a227) primary, wood browns, `carpet`
  crimson. Tokens live in `frontend-next/tailwind.config.ts` and `frontend-next/lib/theme.ts`
  (`HALL_PALETTE` — shared between the Tailwind DOM layer and the canvas renderer).
- Root cause of most "flat/whack" UI complaints so far: canvas renderer had real color variety
  (torch orange, slime green) that never made it into the DOM-level Tailwind tokens, which were
  effectively gold-and-gray only. Fixed the token layer (`cyan`, `vault`, `arcane` added; dead
  `common/uncommon/rare/epic/legendary/mythic` tokens corrected to match `lib/game.ts`'s real rarity
  ladder: common gray, uncommon green, rare blue, epic purple, legendary orange, mythic pink).
- Rail nav: each icon now carries its own persistent accent hue (gold/hub, cyan/market,
  orange/workbench, violet/gearstation, parchment/collection) instead of the old flat gold-or-gray
  binary. See `RAIL_ACCENTS` in `components/RailIcons.tsx`.
- Buttons: `.pixel-btn` / `.pixel-btn-gold` (globals.css) use a "chunky" flat solid drop-shadow +
  press-down-and-flatten mechanic (adapted from a Somnia reference project's button feel, see below)
  — `box-shadow: 0 4px 0 <dark>`, `:active` does `translateY(4px)` + removes the shadow.
- Brand mark: `components/BrandCrest.tsx` — hand-built SVG shield crest (gold trim, wood fill, gold
  rivets, beveled "B" monogram). Replaced a mismatched placeholder `logo.png` (generic pink-background
  ninja badge) that was live on the mobile gate screen. `logo.png` deleted.
- Boot splash: `components/SplashScreen.tsx`, wired into `app/providers.tsx`. Chunky beveled
  "BERATHEON" wordmark (gold/wood/crimson layered text-shadow), 1.3s minimum then fades. Same
  layered-bevel *technique* as Gigaverse's loading screen, our own colors.

## Reference material (in repo, gitignored-safe to keep or delete later)

- `trainV1.webm` — Gigaverse wallet-connect + branded loading-screen recording. Extracted exact pixel
  colors from the loading wordmark (gold `#f5cd38` → orange `#ea9419` → magenta `#b3005d` bevel,
  white outline, pure black bg). Used as the *technique* reference for our splash, not the palette.
- `v2train.webm` — actual Gigaverse dungeon combat footage. Real reference for HUD layout (HP/ARM
  bars, floor/room badges, move-cards with atk/def/charges, damage-number pop). Used to find/fix the
  duplicate-attack-number bug in `components/combat/CardHand.tsx`.
- `EventContract-Somnia-main/` — a *different* project (Somnia-chain prediction-market game skinned
  as a farm sim, "Harvest Call"). Flagged by the sandbox as external/untrusted code — don't `npm
  install`/run it without thinking about that again. Read-only sourced for two techniques only:
  1. Flat solid drop-shadow + press-down button mechanic (adapted into `.pixel-btn`, done).
  2. Not yet done: every disabled control there carries a mandatory `reason: string | null` prop
     shown as a tooltip, so nothing refuses silently. Beratheon doesn't have this yet — worth adding
     as its own scoped task (needs a shared button component; touches many files).
  Did **not** adopt its cream/terracotta/sage palette — genre mismatch with a dark dungeon crawler.

## Big decision log

- **2026-09-24: FlowVault fully removed.** Bounty's done, was gating the core loop (couldn't even
  enter a dungeon without a vault deposit) — user chose full removal over hiding/keeping-optional.
  Deleted `components/VaultTreasury.tsx`, `lib/vaultGate.ts`, `lib/flowvault.ts`, the `flowvault-sdk`
  dependency. Stripped references from `WalletProvider.tsx`, `TopBar.tsx`, `Gigamarket.tsx`,
  `DungeonSelect.tsx`, `SideRail.tsx`/`RailIcons.tsx`, `app/page.tsx`. Kept `@stacks/connect` etc. —
  general wallet connection is still used for marketplace STX trades, username NFT mint, noob pass
  mint. Gigamarket's on-chain buy call had an `isJuiced` fee-tier flag that was driven by FlowVault
  stake status — hardcoded to `false` (full fee tier) since the stake concept no longer exists; flag
  this if fee-tier logic ever needs revisiting. Updated stale "FlowVault" marketing copy in
  `app/layout.tsx` metadata and `MobileDesktopGate.tsx`. Verified via temporarily forcing
  `useState<Screen>('dungeonselect')` in `page.tsx` to confirm free dungeon entry, then reverted —
  **if you ever see `useState<Screen>('dungeonselect')` or similar non-`'hub'` default in page.tsx,
  that's a leftover test edit, revert it.**
- **2026-09-23: security fix.** `.gitignore` was literally just the word `guny` (typo/accident) —
  real testnet mnemonic in `backend/.env` and `clarity-contracts/settings/Testnet.toml` was one
  `git add -A` away from landing in the public GitHub repo. Never actually got committed (checked
  `git log --all`), but fixed the `.gitignore` properly. Mnemonic still sits in those two files
  unencrypted — that's normal for local dev, just don't commit them.

## Known stale/uncommitted state (as of 2026-09-24)

- Repo has real uncommitted work beyond this session's edits: `NoobPassModal.tsx`,
  `lib/noobPassChain.ts`, a `contracts/` dir (separate from `clarity-contracts/`), `DEPLOY.md`,
  `FLOWVAULT.md` (now stale — describes the removed vault feature, candidate for deletion or a
  rewrite, not yet touched). Check `git status` before assuming the working tree matches any
  particular commit.
- `trainV1.webm` / `v2train.webm` / `EventContract-Somnia-main/` are reference material dumped in the
  repo root, not part of the app. Fine to leave for now; consider moving to a `reference/` folder
  (gitignored) if they start cluttering `git status`.

## Not yet done / candidate next steps

- Reason-pattern for disabled buttons (see Somnia reference above).
- Combat screen's world backdrop / Workbench screen haven't been directly benchmarked against
  Gigaverse footage yet (Hub, Rail, Market, Gear Station, Combat cards, DungeonSelect all have been).
- `FLOWVAULT.md` doc file is now inaccurate (describes removed feature) — decide: delete, or rewrite
  as a "what we built and why" historical note.
- No dungeon-hall environment art pass beyond lighting fixes (more prop variety was flagged early on,
  not acted on — deliberately deprioritized as multi-day art work).
