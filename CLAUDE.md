# Trippie Chomp — Project Instructions

A Pac-Man-style web game for YouTrip's **May Travel Fund campaign** (launches May 7 2026 — 8 days). This file is auto-loaded by every Claude Code session opened in this directory.

## Read first (in this order)

1. **`PLAN.md`** — canonical execution plan. Locked 2026-04-29 by HQ. Don't re-litigate decisions in §5; expand §6 into code-level tasks.
2. **`CREATIVE-BRIEF.md`** — locked creative direction (7-level world tour: SG Airport → JP/TH/KR/MY/US/Bali, boarding pass interstitials, destination-aware share images). Don't re-explore directions.
3. **`COPY.md`** — per-destination copy (boarding pass subtitles, share headlines, sting cues).
4. **`src/config/levels.ts`** — `LevelConfig` schema + `LEVELS[]` data + `getLevelConfig(level)` resolver handling endless loop after L7. Drop-in: import `getLevelConfig(currentLevel)` in GameScene.

## Mission

Build a **top-tier** web game (Subway Surfers / Crossy Road polish, NOT marketing prototype) by May 7. Existing-user-led (in-app webview) but produces shareable IG Story artifacts that drive acquisition signups. Real KPIs: plays-per-user, shares-per-play, share-clickthrough rate.

## Stack

Phaser 3.80 + TypeScript + Vite. Pure static build. Mobile-first 480×720 portrait. `npm run dev` for local dev server.

## Current state (2026-04-29 evening)

**Codebase:** Initial commit Apr 24 by Kelicia. Single-commit baseline. All gameplay logic in `src/scenes/GameScene.ts` (~23KB). 5 scenes, 3 entities (Player/Ghost/BonusItem), 2 systems (AudioSystem procedural, ShareImage 1080×1920 IG Stories generator).

**Creative direction:** LOCKED. World tour, 7 levels, palette + parallax + boarding-pass cards. NO mechanic changes — ghost AI, player movement, dot/pellet logic, scoring all preserved.

**Asset production:** Other HQ session is generating assets via `scripts/gen.py` and `scripts/gen-gpt.py` (image_gen.py wrappers), writing raw outputs to `generated/`. Already produced: 6 raw bgs (SG/JP/TH/KR/MY/ID/US) + 3 Tokyo style variants — Tokyo style B (pixel art) won the validator. Iterations at `generated/tokyo-pixel-b2-v3.png`. Final processed assets land in `public/assets/` per the asset-key naming in `levels.ts`.

**Pending creative:** 7 share-image variants (1080×1920, Trippie at each destination), parallax sprite layers (21 total, 3 per destination — see `levels.ts` `bgLayers`).

**Codebase audit findings (already known, don't rediscover):**
- `public/assets/game-bg.png` (3.9MB) is loaded in PreloadScene but NEVER rendered — DELETE
- `public/assets/start-screen.png` (971KB) is NEVER loaded — DELETE
- `game-over-bg.png` (5.8MB), `trippie-coins.png` (3.0MB), `trippie-face.png` (1.1MB) need WebP @ 80% conversion
- No mute button anywhere
- HowToPlay START GAME button at y=665 may clip on iPhone SE
- Teleport bonus has direction-not-reset bug (player can briefly stick if destination wall in current dir)
- Audio is 100% procedural Web Audio oscillators (clever, but pure 8-bit feel)
- ShareImage canvas is well-designed but lacks campaign URL/hashtag/handle (must be baked in)
- Phaser bundle ~1.2MB gzipped → target total payload <2MB after asset compression

## Working assumptions (TBD from Kelicia, treat as placeholders)

- Campaign URL: `youtrip.com/travel-fund` (placeholder; Cheryl/Kelicia confirming)
- Campaign hashtag: `#YouTripTravelFund` (placeholder; Kelicia confirming)
- IG handle: `@youtrip` vs `@youtrip_sg` (Kelicia confirming)
- GA4 property ID: TBD

Use these placeholders in code; swap when confirmed.

## Quality bar (operationalized)

See `PLAN.md` §4 for the table. Highlights:
- Total payload <2MB after WebP
- Each interaction has juice (particles, screen shake, score floaters, camera punch)
- Audio = hybrid (real impact SFX + procedural chiptune BGM)
- Share image bakes URL + #hashtag + @handle into pixels (not just share text)
- 60fps held on 2-yr-old phones

If a dimension fails the bar, cut it. Don't ship half-versions.

## Decisions locked (don't re-litigate)

| ID | Decision | Why |
|----|----------|-----|
| A | UTM URL + hashtag + handle on share image, no in-game email capture | Acquisition path = friend taps URL → signup. Email adds PDPA + 4hr cost, no measurable lift |
| B | Audio HYBRID — real SFX for high-impact, chiptune BGM | Pure procedural reads cheap to paying users |
| C | Global leaderboard with optional handle (Supabase free tier) | Existing-user community needs intra-competition |
| E | Visual style: pixel art (Tokyo B variant won validator) | Consistent with existing aesthetic, mobile-readable |
| F | Cloudflare Pages, repo flips private as FINAL step (May 6) | CF unlimited bandwidth; private flip needs CF live first |
| G | Score framing "YOU SAVED S$X" with explicit per-pickup floaters (+S$10 / +S$50 / +S$200) | Score number must be earned narratively in-game (no real user-data seeding) |

## Workflow

- Single branch `main`, frequent small commits, no PRs (solo dev, 8-day timeline)
- Local dev via `npm run dev`, test on phone via Cloudflare Pages preview URL once CF is set up
- For substantive code work, you can spawn the `trippie-game-dev` agent — it has been briefed on this project's history; check `~/.claude/agents/` for its definition
- For asset processing (raw → WebP, resize, drop into `public/assets/`), use scripts in `scripts/`

## What NOT to do

- Don't change ghost AI, player movement, dot/pellet logic, or scoring math (creative direction is presentation-layer only)
- Don't build features not in PLAN.md without checking with Terry
- Don't accept marginal assets to "save time" — regenerate if quality fails
- Don't push to remote on every commit without local validation (`npm run dev` smoke test)
- Don't flip the GitHub repo to private until Cloudflare Pages is verified working

## Key paths

- **Master plan:** `PLAN.md`
- **Creative direction:** `CREATIVE-BRIEF.md`
- **Per-destination copy:** `COPY.md`
- **Level config:** `src/config/levels.ts`
- **Asset gen scripts:** `scripts/gen.py`, `scripts/gen-gpt.py`
- **Raw asset outputs:** `generated/`
- **Production assets:** `public/assets/`
- **Game code:** `src/scenes/`, `src/entities/`, `src/systems/`, `src/config/`

## Communication with HQ

The HQ Chief-of-Staff session lives at `~/life/marketing-org/hq/`. If you need strategic decisions, campaign context, or coordination with other YouTrip marketing work, that's where to escalate. For pure code/asset execution, stay in this directory.
