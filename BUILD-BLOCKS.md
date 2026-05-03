# Trippie Chomp — Verifiable Build Blocks

**Locked:** 2026-04-30 | **Updated:** 2026-05-01 (post-Kel push) | **Launch:** 2026-05-07 | **Build window:** Sat-Sun May 2-3 (16-24 hrs)

This is the **execution-time companion** to `PLAN.md`. PLAN.md is the strategic doc (campaign context, decisions, risks, dependencies). This doc is the **block-by-block build sequence** — the order in which code + graphics get assembled, with explicit verification gates between blocks.

The lesson from the 2026-04-29 creative session: **don't generate creative in isolation, then try to integrate.** Generate → integrate → verify in-game → commit → next. No assets ship without an in-game readability check.

---

## Baseline state — Kel's commit `9918e5b` (2026-05-01)

Kel pushed source to main 2026-05-01: "Iterate game design: 3 monsters, new sprites, music, polish" — 1030 line additions across 29 files. **This is the new starting point.** What's now in:

**Game design:**
- **3 monsters** (was 4 ghosts). Dropped `'shy'` AI. Now: chase=blue / ambush=green / patrol=orange.
- All 3 start in pen, staggered release (1.5s/5s/9s).

**Visuals (Kel's high-bar pixel art):**
- Trippie redrawn at higher resolution + new chomp animation frames (`trippie-left-open` / `trippie-right-open`).
- 3 new monster sprites + dead variants (~2.5 MB total PNG).
- Larger card/globe/airplane bonus sprites.

**Audio (DECISION B OVERRIDDEN — procedural accepted):**
- Two BGM tracks: **lobby** (Arpeggio Ambient) on title/HowToPlay, **game** (Happy Adventure Bounce) during play.
- Pure procedural Web Audio (no real SFX samples). Per Terry 2026-05-01: ship as-is. No kenney.nl SFX layer.
- New `'gameover'` SFX type added.
- `audioSystem.startBGM(track)` API change: `'lobby' | 'game'`.

**Game feel additions (partial):**
- Screen flash rectangle (full canvas) for level-up.
- Popup glow graphics (radial gradient behind text).
- Popup text bumped to 28px / stroke 5.
- Game-over score 14px → 20px / stroke 2 → 3.
- **Still missing:** per-pickup score floaters, screen shake on death, "FROM FOREIGN FEES" copy.

**Touch input rewritten:**
- Native `touchstart`/`touchmove` document events with `preventDefault` (kills iOS rubber-band scroll).
- 5px direction-flip threshold.
- Scene shutdown cleanup.

**HowToPlayScene:** 113-line rework (likely covers iPhone SE clip fix from PLAN.md §6 — verify).

**ShareImage.ts:** refactored, mirrors GameOverScene design, new `drawStrokedText` helper, cover-fit bg. **Still uses `game-over-bg.png` as source — destination-aware logic not added (matches our locked single-share decision).**

**Bloat watch:** total `public/assets/` payload now ~24 MB (way over 2 MB target). WebP conversion is even more critical.

---

## Operating rules

1. **Each block ends with a git commit** carrying the block number. Rollback is one `git revert` away.
2. **Each block has a verification gate** (visible behavior in the running game) that must pass before the next block starts.
3. **No new asset enters `public/assets/` without verification in-context.** Generate → drop into game → screenshot/eyeball → keep or re-roll.
4. **Dev server stays running.** Vite hot-reloads, so visual checks are immediate.
5. **If a block fails verification:** fix or revert before proceeding. Don't carry incomplete blocks forward.

---

## Cuts already locked (don't re-litigate)

Per Terry's call 2026-04-30:
- **No leaderboard.** Decision C from PLAN.md is overridden — game has no global leaderboard. Existing-user community competition is acceptable casualty.
- **No score-milestone share variants.** Drop the 21-variant idea; ship a single share image at game-over.
- **No destination-aware share variants.** Originally locked in PLAN.md §3 — overridden. One generic share image regardless of level reached.
- **No parallax / vehicle / atmospheric sprite layers.** Tested 2026-04-29, broke visual hierarchy. Static destination bgs only.

Per Terry's call 2026-05-01:
- **No real SFX samples.** Decision B from PLAN.md is overridden — Kel's pure procedural audio with two BGM tracks ships as-is. Saves ~1hr of sourcing + integration work.
- **Design team owns the share-hero asset.** Not us. Block 4 ships a placeholder so the flow is wired and ready for swap-in.

These cuts simplify Block 4/6 and remove what would have been Block 9. Total estimated weekend work drops from ~14-17hrs to **~9-10hrs**.

---

## The blocks

### Block 0 — Plumbing + cleanup (~1.5h)

**Goal:** all the boring foundation work in one block so the rest can move fast.

**Steps:**
1. Recreate `src/config/levels.ts` with `LevelConfig` interface, `LEVELS[]` array (7 entries), `getLevelConfig(level)` resolver, `getLoopNumber(level)` helper. Schema in head; reference `COPY.md` for cityCode/flag/headline.
2. **Delete dead assets:**
   - `public/assets/game-bg.png` (3.9 MB, never rendered)
   - `public/assets/start-screen.png` (1 MB, never loaded)
   - **All 7 `share-*.png` files** — design team is producing the canonical share asset separately; we ship a placeholder until they deliver
3. **WebP convert remaining heavy PNGs:**
   - `game-over-bg.png` (5.8 MB → ~300 KB)
   - `trippie-coins.png` (3 MB → ~150 KB)
   - `trippie-face.png` (1.1 MB → ~80 KB)
   - Use `cwebp -q 85` or PIL.
   - Update `PreloadScene.ts` extensions.
4. **Loading bar in PreloadScene** — `this.load.on('progress')` updates a simple Phaser Graphics fill rectangle. From t=0, no black-canvas anxiety.
5. **PreloadScene loads all 7 destination bgs** — iterate `LEVELS` array, load `bg-${id}` for each.
6. **GameScene reads `getLevelConfig(this.level).bgAsset`** instead of hardcoded `'game-over-bg'`.

**Verification gate:**
- `npm run dev` runs clean
- Total `public/assets/` payload <2MB
- Loading bar visible during preload, fills smoothly
- Game starts at L1 → SG Airport bg visible behind maze
- Force `level=2` (debug param `?level=2` or temp constant) → Tokyo bg visible
- Maze still readable on both

**Commit:** `block 0: plumbing, cleanup, WebP convert, per-level bg loading`

---

### Block 1 — Verify 7 bgs in-context (~1.5h, includes re-roll buffer)

**Goal:** every destination bg passes readability check with maze + dots + sprites overlaid. Re-roll any that fail.

**Steps:**
1. Add a debug level-skip mechanism (URL param `?level=N` or keypress).
2. Walk through L1-L7. At each level, screenshot and check:
   - Gold dots (`COLOR_DOT 0xFFD700`) readable against bg
   - Deep purple walls (`COLOR_WALL 0x150D26`) contrast OK
   - Player sprite (purple Trippie) visible
   - Ghost sprites (chaser/ambusher) visible
   - HUD text (top score, level, lives) readable
3. For any failure: re-roll bg via `image_gen.py` with stricter prompt, run `process_assets.py`, retest.

**Verification gate:**
- All 7 levels: screenshot recorded, dots/walls/sprites/HUD readable, posted to `generated/qa/level-N.png` for record
- No re-roll backlog
- Visible bg portion is the world-tour storytelling vehicle

**Commit:** `block 1: 7 destination bgs verified in-context`

**Risk:** if 4-5 bgs fail, this stretches to 3-4hrs. Mitigation: time-box re-rolls at 2 attempts per bg; if a bg still fails after 2 re-rolls, accept the version that's least bad and move on.

---

### Block 2 — Per-destination palette overrides (~30m)

**Goal:** wall colors subtly shift per destination so each level feels distinct beyond just the bg.

**Steps:**
1. `GameScene.drawMaze()` reads `getLevelConfig(level).palette` for `wall`, `wallBorder`, `dotAccent`.
2. Falls back to `COLOR_WALL` / `COLOR_WALL_BORDER` if no override.
3. Apply per-level palette in maze rendering.

**Verification gate:**
- L2 Tokyo: walls have pink-tinged border (sakura accent)
- L3 Bangkok: walls have gold accent
- L4 Seoul: walls have electric purple
- L5 KL: walls have green-teal
- L6 NYC: walls have warm yellow
- L7 Bali: walls have warm orange
- **Critical:** dots still pop on every variant. Test at each level explicitly.

**Commit:** `block 2: per-destination wall palette overrides`

---

### Block 3 — Boarding pass interstitial (~1.5h)

**Goal:** 2-second card between levels showing destination. Cinematic but fast.

**Approach decision (locked):** **Code-rendered, not AI-illustrated.** Gemini variants would be inconsistent across 7. A styled Phaser Graphics rect + text + flag emoji is deterministic and tweakable.

**Steps:**
1. New `BoardingPassScene` (or scene-overlay).
2. After level-win event, transition: GameScene → BoardingPassScene → GameScene (next level).
3. Card shows: "YOUTRIP AIRWAYS" header, "NOW BOARDING:" subtitle, destination name + flag emoji, IATA code, "Gate 03 / Seat: TRIPPIE".
4. Slide-in animation (300ms), hold 1.4s, slide-out (300ms) = 2 sec total.
5. Read all data from `getLevelConfig(nextLevel)`.

**Verification gate:**
- Beat L1 → boarding pass shows "TOKYO 🇯🇵 / TYO" before L2 starts
- Beat L2 → "BANGKOK 🇹🇭 / BKK"
- Beat L7 → "TOKYO 🇯🇵 / TYO" (loop confirms)
- Timing feels right (test playing 3 levels in a row)
- No flicker, no scene-load delay

**Commit:** `block 3: boarding pass interstitial`

---

### Block 4 — Share-image flow with placeholder (~1h)

**Goal:** game-over generates a shareable 1080×1920 IG Story image. **Design team is producing the actual hero asset separately** — for the build, ship a placeholder so the share flow is fully wired and ready for the real asset to drop in.

**Asset decision (locked):** Placeholder only. Design team owns the canonical share-hero. The build's job is to make the flow work; swap-in is one filename rename when they deliver.

**Steps:**
1. Create `public/assets/share-hero-placeholder.png` — simple 1080×1920 PNG, dark navy background, large text "TRIPPIE CHOMP / PLACEHOLDER", a Trippie sprite scaled up for vibe. Generated fast or hand-built in 5 min.
2. Modify `ShareImage.ts`:
   - Drops destination-aware logic
   - Composites: placeholder image + dynamic text layer (score, fee monsters beaten, URL, hashtag, handle)
   - Text positioning: top 1/3 reserved for "YOU SAVED S$X!" headline, bottom 1/3 for stats + URL
3. Use placeholder URL/hashtag/handle (real values TBD from Kelicia, swapped pre-launch).
4. Native share sheet on tap (Web Share API), fallback to download on Android.
5. Document the swap-in protocol: design team's file lands at `share-hero.png`, update one `this.load.image` line in PreloadScene.

**Verification gate:**
- Die at any level → game-over screen shows score
- Tap share → 1080×1920 image generated with score, URL, hashtag, handle baked
- Image valid PNG, downloadable
- The placeholder is OBVIOUSLY a placeholder (no risk of accidentally shipping it as final)
- Swap-in path documented in code comment

**Commit:** `block 4: share flow wired with placeholder hero`

**iOS WebP+Canvas2D risk (PLAN.md §8):** ShareImage uses Canvas2D `drawImage()`. If WebP source breaks on iOS Safari, fall back to a PNG version of share-hero specifically. Test on real iOS device during Block 9.

---

### Block 5 — Score floaters + screen shake + score narrative (~45m)

**Goal:** per-pickup score juice on top of Kel's existing popup glow + screen flash.

**Already done by Kel:** screen flash for level-up, popup glow gradient, bigger popup text (28px stroke 5).

**Still needed:**
1. **Per-pickup score floaters** — on dot/power/ghost eat, spawn tween at pickup position:
   - Dot: `+S$10` (yellow), tween up 40px + fade 800ms
   - Power: `+S$50 POWER!` (cyan), bigger
   - Ghost: `+S$200 FEE EATEN!` (gold), camera punch zoom
2. **Screen shake on death** — `this.cameras.main.shake(300, 0.015)` (1 line)
3. **Power pellet particle burst** — 12 golden particles, 600ms lifespan (Phaser built-in particle emitter)
4. **Game-over copy update** — "YOU SAVED S$X!" → "YOU SAVED S$X **FROM FOREIGN FEES!**" (Decision G locked)

**Verification gate:**
- Play 30-sec session, every pickup has a floating "+S$X" at position
- Eat ghost while powered → +S$200 floater + camera punch
- Die → screen shakes
- Game-over copy reads "YOU SAVED S$X FROM FOREIGN FEES!"

**Commit:** `block 5: per-pickup score floaters + screen shake + score narrative`

**Risk:** particle counts on mid-tier Android. Cap at 12 particles, profile during Block 9.

---

### Block 6 — Mute button + teleport fix (~30m)

**Goal:** mute button in HUD, known game bugs fixed. Audio itself is Kel's pure procedural — accepted as-is per 2026-05-01.

**Steps:**
1. **Mute button** in HUD top-right, persists via localStorage. Calls `audioSystem.mute()` / `unmute()` (add if not present).
2. **Teleport bug fix** — reset `player.dir` and `nextDir` after teleport (PLAN.md §8 known bug).

**Verification gate:**
- Mute button toggles all audio (BGM + SFX) on/off
- Mute state persists across reloads
- Teleport while moving up → no stick at destination wall

**Commit:** `block 6: mute button + teleport fix`

**Note:** Decision B (hybrid SFX) was overridden 2026-05-01. Kel's procedural-only with 2 BGM tracks (lobby/game) ships. If post-launch user feedback says audio reads cheap, revisit by sourcing kenney.nl SFX in a v1.1.

---

### Block 7 — Game-over destination context + verify HowToPlay (~30m)

**Goal:** game-over reflects the world tour. Verify Kel's HowToPlay rework already covers iPhone SE.

**Already likely done by Kel:** HowToPlayScene was 113-line rework — likely covers iPhone SE clip fix. Verify before scheduling additional work.

**Still needed:**
1. **Game-over screen** — show "Reached: TOKYO" line based on highest level. Pulls from `getLevelConfig(highestLevel).destination`.
2. **iPhone SE QA on HowToPlay** — confirm Kel's rework reaches the START GAME button on 568px height. If not, compress further or add scrollable container.

**Verification gate:**
- Game-over shows destination context line
- iPhone SE: HowToPlay START button reachable without scroll-off

**Commit:** `block 7: game-over destination + iPhone SE verify`

---

### Block 8 — GA4 analytics (~45m)

**Goal:** post-launch we can measure plays, levels, shares, signups.

**Steps:**
1. Add GA4 tag (placeholder property ID until Cheryl confirms).
2. Fire 5 events:
   - `game_start` — play button tapped
   - `game_over` — lives = 0, includes score + destination
   - `level_reached` — fired at each level transition, includes level number
   - `share_clicked` — share button tapped
   - `share_completed` — share sheet success
3. UTM params attached on share URL.

**Verification gate:**
- Open GA4 DebugView (or browser extension)
- Play through to game-over → see all 5 events fire in order
- Share image tapped → `share_clicked` fires
- Share sheet completes → `share_completed` fires

**Commit:** `block 8: GA4 analytics with 5 events`

---

### Block 9 — Mobile QA (~1.5h)

**Goal:** game works on real iOS Safari + Android Chrome. Bug fixes from QA findings.

**Steps:**
1. Deploy to Cloudflare Pages preview (or use ngrok for tunneled localhost).
2. Test on real iOS device (Safari):
   - Touch swipe input
   - Share sheet fires (Web Share API)
   - WebP loads correctly
   - Audio unlocks on first tap
   - 60fps held
3. Test on real Android device (Chrome):
   - Same checklist
   - Share fallback (download) if Web Share API unavailable
   - Performance on mid-tier
4. Fix any bugs surfaced.

**Verification gate:**
- Touch input responsive
- Share works (or downloads as fallback)
- No frame drops on a 2-yr-old device
- HowToPlay button reachable on iPhone SE
- Audio plays, mute persists

**Commit:** `block 9: mobile QA + bug fixes`

---

### Block 10 — Final playthrough (~30m)

**Goal:** full session end-to-end test. Catch anything blocks 0-9 didn't.

**Steps:**
1. Cold-load the game (clear cache).
2. Play start-to-game-over without skipping anything.
3. Reach at least L4 (4 boarding passes, 4 destinations seen).
4. Generate share, complete native share, verify URL works.
5. Replay 1-2 more times.

**Verification gate:**
- Cold load <1.5s FCP on 4G
- Loading bar visible from t=0
- All visual juice fires (floaters, shake, particles)
- Boarding pass between every level
- Audio + mute work
- Share image generates correctly
- No JS errors in console
- Cheryl-and-Cass-IG-shareable test passes

**Commit:** `block 10: final playthrough verified`

---

## Block dependency graph

```
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
                 (parallel safe: 5+6+7 if multi-tasking)
```

Blocks 5/6/7 are independent of each other; can be reordered. All others are strictly sequential.

---

## Total time estimate (post-Kel push, post-procedural-audio)

| Block | Estimate | Cumulative | Status |
|-------|----------|------------|--------|
| 0 | 1.5h | 1.5h | needs to run from Kel's baseline |
| 1 | 1.5h | 3.0h | depends on 0 |
| 2 | 0.5h | 3.5h | small |
| 3 | 1.5h | 5.0h | new scene |
| 4 | 1.0h | 6.0h | placeholder share, code mostly done |
| 5 | 0.75h | 6.75h | shaved — Kel's flash/glow done |
| 6 | 0.5h | 7.25h | shaved — no SFX sourcing |
| 7 | 0.5h | 7.75h | shaved — HowToPlay likely done |
| 8 | 0.75h | 8.5h | GA4 |
| 9 | 1.5h | 10h | mobile QA |
| 10 | 0.5h | 10.5h | playthrough |

**~10 hrs of focused work.** Comfortably fits 16-24hr Sat-Sun window with healthy margin for surprises.

---

## Cuts if running tight (priority order to drop)

1. **Block 7** (title polish + bg pulse) — 1h. Existing screens are workable.
2. **Block 6 audio SFX** (keep mute button + teleport fix) — saves 45m. Chiptune-only is acceptable per Decision B fallback.
3. **Block 5 floaters/particles** (keep screen shake + copy update) — saves 45m. Game-over still has score number.
4. **Block 2 palette** — 30m. Single palette across destinations is acceptable.

**Last to drop (the world-tour spine + analytics + QA):** 0, 1, 3, 4, 8, 9, 10.

If only 6 hrs available: ship 0 + 1 + 3 + 4 + 9 + 10 = ~7hrs (single bg variant, boarding pass, share, mobile-QA'd). Hits the world-tour direction at minimum viable.

---

## Outside-repo dependencies (NOT in this plan)

These are tracked in PLAN.md §8 and don't block weekend code execution per Terry's 2026-04-30 directive:
- Kelicia: campaign URL, hashtag, IG handle, in-app entry point
- DNS for play.youtrip.com
- Cloudflare account + repo private cutover
- T&Cs + GA4 property ID
- Final share image copy review

Code can ship with placeholders for all of these; swap when confirmed. **Saturday code work is independent of these.**

---

*Locked 2026-04-30 by HQ + Terry. Block 0 begins Sat May 2 morning.*
