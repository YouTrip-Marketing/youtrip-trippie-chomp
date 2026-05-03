# Trippie Chomp — Creative Direction (locked)

**Decision doc.** Direction locked 2026-04-29 after a creative session with HQ. Hands off to the trippie-game-dev agent for execution.

---

## The direction in one line

**Pac-Man stays Pac-Man. Airport opener, then a rotating world-tour loop where the magic lives in the destinations — not the mechanic.**

Theme garnishes the game; it doesn't overwrite it. The fast-paced chomp loop is sacred. Background, palette, and a 2-second between-level moment do the storytelling.

---

## What the game is (unchanged)

A Pac-Man-style maze game in the YouTrip skin. Pre-existing build by Kelicia (Apr 24 2026):

- **Player:** Trippie character, dot-eating maze runner (480×720 portrait, mobile-first)
- **Enemies:** 4 ghost types ("fee monsters") with distinct AI: chase, ambush, patrol, shy
- **Items:** Dots (10pts), power pellets (50pts, makes ghosts edible), bonus items (boost/teleport/freeze)
- **Loop:** Eat all dots → next level → speed increases → repeat
- **Game over:** Lives run out → score card → share image to IG → enter giveaway
- **Score framing:** "YOU SAVED S$[score]!" — score = $ saved at YouTrip rates

**Stack:** Phaser 3.80 + TypeScript + Vite. Static build. Mobile-first portrait.
**Repo:** `~/projects/youtrip-trippie-chomp/` — github.com/YouTrip-Marketing/youtrip-trippie-chomp

---

## Why this exists

The game is a component of YouTrip's **May Travel Fund campaign** (May 7 - Jun 30, $50K, only Q2 acquisition campaign). 70% acquisition / 30% existing-user spend.

**Game's role:** webview inside the YouTrip app (existing users) + public Cloudflare URL via KOLs/OOH. Job: entertain existing users + produce IG shares that feed acquisition.

**Quality bar:** TOP-TIER. Existing paying users are judging brand sophistication. Subway Surfers / Crossy Road polish, not "marketing prototype."

**Real KPIs:** plays-per-user, shares-per-play, share-clickthrough rate. Signups downstream.

---

## The level structure (locked)

7 levels per loop. Speed increases each level. After L7, loops back to L2 (JP) at higher speed and continues indefinitely.

| L | Destination | Visual signature |
|---|-------------|------------------|
| 1 | **SG Airport** | Tutorial. Peach dawn sky, control tower + plane on apron, palms. |
| 2 | **Tokyo, JP** | Mt Fuji + Tokyo Tower, neon city, sakura petals drifting. |
| 3 | **Bangkok, TH** | Wat Arun spire, golden hour sky, river boats, palms. |
| 4 | **Seoul, KR** | N Seoul Tower + Bukhansan, neon hangul shopfronts. |
| 5 | **Kuala Lumpur, MY** | Petronas Towers + jungle hills, evening palette. |
| 6 | **New York, US** | Brooklyn Bridge + Manhattan skyline + crescent moon. |
| 7 | **Bali, ID** | Mt Agung + Uluwatu temple cliff + tropical sunset. Big tonal break — closes the loop on "paradise." |

**Loop behavior after L7:** Return to L2 at +1 speed tier. Endless. Player who reaches "second loop Tokyo" has bragging rights.

**Static destination bgs, no parallax.** Considered animated parallax (vehicles, atmospheric layers) and dropped — the maze occupies y=134-638 of the 480×720 canvas, leaving only ~80px below it. Vehicle layers either get hidden by the maze or compromise the visual hierarchy. The neon pixel art already feels alive through saturated colors and implied glow. If we want subtle motion later, a small `setTint` pulse on the bgImage or an alpha-pulse overlay of just the neon spots is a 30-min add — but not a launch dependency.

---

## Between-level moment: boarding pass card

2-second interstitial between levels. Templated boarding pass:

```
┌─────────────────────────────┐
│  YOUTRIP AIRWAYS            │
│                             │
│  NOW BOARDING:              │
│  BANGKOK  🇹🇭                │
│                             │
│  Gate 03    Seat: TRIPPIE   │
└─────────────────────────────┘
```

One template, 7 variants (city code + flag swap). Cinematic, fast, makes the world-tour feel concrete without breaking gameplay flow. Sells the destination harder than a fade transition would.

---

## Score & share

**Score framing unchanged:** "YOU SAVED S$[score]!" Each dot = +S$10, power pellet = +S$50, fee monster = +S$200.

**Share image — destination-aware.** 7 variants, one per furthest destination reached this session. Player who replays gets different brag images each session = multiple shares per player.

**Template (1080×1920 IG Story):**
- Hero: Trippie illustrated at the destination (Trippie at Tokyo Tower, Trippie at Petronas, Trippie at Statue of Liberty)
- Headline: "TRIPPIE MADE IT TO [CITY]"
- Stat block: "Saved S$[score]" + "Beat [N] fee monsters"
- Footer: campaign URL + #hashtag + @youtrip handle (TBD from Kelicia/Cheryl)

---

## What we're NOT doing

Explicitly cut from the brainstorm so the trippie-game-dev agent doesn't reintroduce them:

- **Food-as-dots** — adds visual noise per dot, slows readability of the maze
- **Festival overlays** — too busy on top of fast Pac-Man play
- **Trippie outfit/character progression** — out of scope for 8 days
- **Round-trip ending / finite arc** — locked endless
- **Daily destination rotation** — over-engineering
- **Per-level soundtrack swap** — keep existing chiptune; optional 3-sec regional sting on level start if time
- **Ghost reframe to "travel pains"** — fee monsters stay as is; reframe adds cognitive load mid-game
- **Currency symbols (¥, ฿) on dots** — leave as plain pellets
- **Parallax vehicle/atmospheric sprites** — tested in-game and messed up the visual hierarchy. The maze takes most of the canvas; the visible bg slice below it (~80px) is too thin for a vehicle layer to read without competing with gameplay. Static bgs only.

---

## Asset list (for execution track)

**Backgrounds (highest priority — drives the entire direction):**
- 7 destination scenes (SG Airport + 6 cities), static, no parallax layers
- Generated via Gemini, post-processed to 480×720 WebP via `scripts/process_assets.py`
- Total payload ~85 KB across all 7 (WebP compression wins big)

**Boarding pass card:**
- 1 SVG/PNG template, 7 city/flag variants

**Share images:**
- 7 IG Story variants (1080×1920) — Trippie at each destination
- Use `shared/integrations/image_gen.py` (OpenAI gpt-image-2 best for text-in-image)

**Audio (nice-to-have, cut if time runs out):**
- 7 regional 3-sec stings on level start (koto chord for JP, gamelan for MY, taxi horn for US, etc.)

**Existing visual elements to reuse:**
- 4 Trippie sprite variants (a/b/c/d) — keep as is
- 2 ghost sprites (chaser, ambusher) — keep as is
- Bonus item sprites: airplane, card, globe, passport — keep as is

---

## Integration notes for trippie-game-dev

The execution plan is owned by the trippie-game-dev agent. This direction layers on top of the existing PLAN.md as follows:

1. **Level config refactor** — extract per-level config (background asset, palette, boarding card data) into a `LevelConfig` array indexed by level number. After L7, loops L2-L7. Already drafted in `src/config/levels.ts`.
2. **Boarding pass interstitial** — new `BoardingPassScene` (or overlay), 2-sec timed, transitions Game → BoardingPass → Game (next level). Simple template + variant data.
3. **Share image generation** — `ShareImage` system needs a `destination` parameter to pick the correct variant. Pre-render all 7 at build time or generate on-demand from the highest level reached.
4. **No mechanical changes** — ghost AI, player movement, dot/pellet logic, scoring all untouched. This direction is pure presentation layer.
5. **Optional polish (post-launch)** — if a subtle "alive" feel is wanted later, a tiny `bgImage.setTint` pulse on a sine tween, or a static neon-overlay PNG with alpha pulse. ~30 min build. Not a launch dependency.

---

## Files & references

- **Repo:** `~/projects/youtrip-trippie-chomp/`
- **Live game:** https://youtrip-marketing.github.io/youtrip-trippie-chomp/
- **Execution plan:** `~/projects/youtrip-trippie-chomp/PLAN.md` (owned by trippie-game-dev)
- **Image gen:** `~/life/marketing-org/shared/integrations/image_gen.py`
- **Hashtag/URL:** TBD from Kelicia (campaign hashtag) and Cheryl/Kelicia (landing page URL)
- **IG handle:** TBD — verify @youtrip vs @youtrip_sg before any final share-image copy

---

## Constraints (still apply)

- 8-day deadline (May 7 launch); Sat-Sun May 1-3 dev window (16-24 hrs)
- Existing Phaser/TS structure — no engine swap
- No backend infra beyond optional leaderboard
- Top-tier quality bar (paying users judging brand)
- Must feel like ONE game, not 6 themed minigames

---

*Locked 2026-04-29 by HQ + Terry. Hands off to trippie-game-dev for asset production and code integration.*
