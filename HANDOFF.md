# Handoff — 2026-05-02

## Pick up where we left off

**Block 0 verification complete.** L1 readability blocker resolved: middle-band darkening applied to all 7 destination bgs at the source-asset level (no runtime overlay). Playwright in-context test on L1 SG Airport confirmed maze cells, dots, walls, and monsters all read with strong contrast against the darkened maze band.

**Next:** Block 1 — verify all 7 destination bgs in-context with debug `?level=N` URL param for skipping. Implement the URL param in `GameScene.create()` (read `URLSearchParams`, override `this.level`), then walkthrough L1→L7 visually.

## Resolution log — L1 brightness blocker

- New script `scripts/darken_bg_middle.py` applies a per-row multiplier to all `public/assets/bg-*.webp`:
  - y=0→110: bright (mult=1.0) — destination context above maze
  - y=110→160: cosine ramp 1.0 → 0.5 — smooth, no banding
  - y=160→600: 0.5 mult — maze readability band
  - y=600→660: cosine ramp 0.5 → 1.0 — smooth
  - y=660→720: bright — HUD overlays this
- Pipeline: `process_assets.py` (raw 1024² → 480×720 WebP with sky-pad) → `darken_bg_middle.py` (in-place darken). Re-runnable end-to-end if we ever need to redo.
- Verified via playwright-cli at `http://localhost:3000/` — screenshot at `.playwright-cli/shots/chomp-l1.png` shows clean maze read.
- Contact sheet of all 7 darkened bgs: `.playwright-cli/shots/chomp-bgs-sheet.png`.
- Hard constraint honored: own playwright test ran before pinging Terry.

## In flight (Block 0 of BUILD-BLOCKS.md) — DONE

✅ Pulled Kel's commit `9918e5b` (3 monsters, BGM tracks, sprite redraws)
✅ WebP conversion complete — `public/assets/` from 24 MB → 1.4 MB
✅ Created `src/config/levels.ts` with 7 LevelConfig entries + `getLevelConfig(level)` resolver for endless loop after L7
✅ Rewrote `src/scenes/PreloadScene.ts` — loading bar + iterates LEVELS to load 7 destination bgs
✅ Modified `src/scenes/GameScene.ts` — `applyLevelBackground()` swaps texture per level, scales to fit
✅ L1 readability — middle-band darkening pipeline (`scripts/darken_bg_middle.py`)

## Build plan (full sequence)

Master doc: `BUILD-BLOCKS.md` (11 verifiable blocks, ~10h total). Cuts already locked: parallax, leaderboard, milestone shares, destination-aware share variants, custom SFX sourcing.

After Block 0 (current) is verified, proceed:
- Block 1: verify all 7 destination bgs in-context, with debug `?level=N` URL param for skipping
- Block 2: per-destination palette overrides (wall/wallBorder/dotAccent from LevelConfig)
- Block 3: boarding pass interstitial (code-rendered, no asset gen)
- Block 4: share-image flow with placeholder PNG (design team owns canonical)
- Block 5: per-pickup score floaters + screen shake + "FROM FOREIGN FEES" copy under HUD
- Block 6: mute button + teleport-bug fix
- Block 7: game-over destination context + verify HowToPlay on iPhone SE
- Block 8: GA4 with 5 events (start, level_complete, game_over, share, mute_toggle)
- Block 9: mobile QA on real devices
- Block 10: final playthrough end-to-end + private repo flip

## Key files modified this session

- `src/config/levels.ts` (NEW) — LevelConfig schema + 7 destinations + endless loop resolver
- `src/scenes/PreloadScene.ts` — loading bar + per-level bg loading
- `src/scenes/GameScene.ts` — `applyLevelBackground()` called from `startLevel()`. Note: `bgImage` is now the level bg (not a static asset).
- `scripts/webp_assets.py` (NEW) — bulk PNG→WebP conversion at q85
- `scripts/process_assets.py`, `scripts/sprite_keyout.py` (existing) — asset pipeline

## Decisions overridden from PLAN.md

- Decision B: audio hybrid → procedural OK (Kel's 2-track BGM stays)
- Decision C: leaderboard → OUT
- Destination-aware shares → OUT (single placeholder, design team owns canonical)
- Parallax sprites → OUT (broke visual hierarchy in test)

## Coordination state

- **Kel:** pushed source as `9918e5b` after Slack DM nudge (was previously only pushing gh-pages build output)
- **Kelicia:** still owes campaign hashtag, UTM URL (likely `youtrip.com/travel-fund`), IG handle. Doesn't block code work.
- **YT tech team:** DNS for `play.youtrip.com` not yet initiated. Fallback `*.pages.dev` acceptable for launch.

## Launch context

- 5 days to May 7 launch
- Terry working personally Sat-Sun May 2-3 (today is Sat)
- 70% acquisition / 30% existing-user spend on $117K May campaign
- Game = in-app webview component, existing-user-led; anonymous score, share-to-IG-to-enter

## Useful refs

- `CREATIVE-BRIEF.md` — locked direction (7 destinations, no parallax, single share)
- `BUILD-BLOCKS.md` — full execution plan with verification gates per block
- `CLAUDE.md` — project-level instructions
- `generated/raw-bg-*.png` — original Gemini outputs if we need to redo any bg
