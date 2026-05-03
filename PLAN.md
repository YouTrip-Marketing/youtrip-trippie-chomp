# Trippie Chomp — Master Build Plan

**Locked:** 2026-04-29 | **Launch:** 2026-05-07 (8 days) | **Author:** HQ
**Replaces:** prior agent-authored first-pass plan (under-shot the bar; rejected).

This is the canonical execution plan. Creative direction is locked in `CREATIVE-BRIEF.md`. Per-destination copy is in `COPY.md`. Level config + endless-loop resolver is in `src/config/levels.ts`. The `trippie-game-dev` agent expands the execution sections into code-level tasks against THIS document, not the rejected first pass.

---

## 1. Campaign context — why this exists

Trippie Chomp is a component of the **May Travel Fund campaign** (May 7 - Jun 30, $50K, only Q2 acquisition campaign for YouTrip in 2026).

**Campaign mix:** 70% acquisition / 30% existing-user spend.

**Game's role within the 70/30:**
- Distribution: webview inside the YouTrip app (existing-user surface) + public Cloudflare Pages URL via KOLs and OOH stunt
- Existing users (the 30%): play, generate shareable artifacts, drive engagement-flavored spend behavior
- Acquisition (the 70%): friend sees IG share → taps share-image URL → lands on signup page → signs up

**Strategic backdrop:**
- Signups -29% YoY locked in 6-day band, April closes ~6,294 signups short, May 7 is the only acquisition lever before June Spend campaign
- KOL trio (Zina S$6,702 / Marilyn S$6,000 / Amira S$3,800) confirmed pending hard lock
- OOH stunt "The Rates Guy" May 2-3 teaser drives top-of-funnel toward the game URL
- $5 CRM cashback for first top-up/spend within 2 weeks runs separately as the existing-user retention layer
- Year of travel giveaway = the prize the share-to-IG mechanic enters

**Real KPIs (in priority order):**
1. **Plays-per-user** — does the existing-user audience actually engage and replay?
2. **Shares-per-play** — does the moment compel them to share?
3. **Share-clickthrough rate** — does the share image's URL drive traffic back?
4. **Signups via share UTM** — does that traffic convert?
5. **Brand sentiment among existing users** — under-rated; a polished YouTrip-tier game inside the app is a brand asset that compounds beyond this campaign.

Signups are a downstream metric. The game's job is plays + shares.

---

## 2. What GREAT looks like — top-tier acceptance criteria

The bar is Subway Surfers / Crossy Road / Stumble Guys. Not "marketing prototype." Not "good enough for 8 days." If we can't hit a dimension, we cut it — we don't ship a half-version.

End-to-end user experience criteria:

**First load (cold visit from KOL share / OOH / friend):**
- Asset payload under 2MB total (Phaser ~1.2MB gz + assets ~700KB)
- First contentful paint under 1.5s on 4G
- Loading bar visible from millisecond zero — no black-canvas anxiety
- Title screen feels like a YouTrip product, not a hobby project

**Title → game:**
- Boarding-pass intro card communicates "world tour" theme in 2 seconds before first level
- Tap-to-start is responsive on first touch, no audio unlock fumble
- L1 (SG Airport) reads as tutorial without text-heavy explanation — visual cues teach the loop

**During play:**
- Trippie's chomp has audible weight — not a chiptune beep but a punchy SFX (Decision B below)
- Each dot collected: subtle particle burst + "+S$10 saved" floating text (~100ms, fades)
- Power pellet collect: full screen flash, particle explosion, audio sting that signals power
- Fee monster eaten: score popup at the monster's position (200/400/800/1600), camera punch zoom, satisfying audio
- Death: screen shake, slow-mo ramp, audio that signals stakes
- Level complete: brief fanfare + boarding pass interstitial naturally segues to next destination

**Between levels (the signature moment):**
- 2-second boarding-pass card slides in: "NOW BOARDING: TOKYO 🇯🇵 | Gate 03 | Seat: TRIPPIE"
- Sells the destination harder than a fade transition would
- Ambient "boarding zone" SFX during transition (optional, cut if time)

**Per-destination experience:**
- Background scene visually transports the player — Tokyo Tower, Petronas, NYC skyline, etc.
- 3-layer parallax: fast (vehicles), medium (atmosphere), static (landmark)
- Wall palette shifts subtly per destination (locked to dot readability — see Decision E)
- Optional 3-second regional sting on level start (koto for JP, gamelan for MY, taxi horn for US)

**Game over:**
- Score card frames "YOU SAVED S$X!" — the score is now narratively grounded by in-game floaters
- Destination-aware share image (the player who reached Bali shares a different image than one stuck at Tokyo)
- Trippie illustrated AT the destination on the share image (not the same image 7 times)
- Friend leaderboard via username (anonymous default, optional handle entry)

**Share moment:**
- Share button is the visual hero on game-over screen
- Native share sheet fires immediately on tap (no email capture friction)
- Share image includes: campaign URL + #hashtag + @youtrip handle baked into pixels (text is editable on IG; image isn't)
- Web Share API on iOS Safari works perfectly; Android Chrome falls back to download (acceptable)

**Replay:**
- "Play Again" reuses the same audio context (no re-init delay)
- Each session reaching a different destination produces a different share image — drives multiple shares per player
- Local high score visible: "YOUR BEST: S$X" + "NEW BEST!" tag when beaten
- Endless loop after L7 → L2 with +1 speed tier, lap counter visible — "Loop 2 in Tokyo" is a legit brag

**Brand:**
- Every visual moment feels like a YouTrip product — palette, type, copy, voice
- No detail screams "we ran out of time"
- Kel + Cheryl + Cass should look at this and want to share it from their personal IGs

---

## 3. Virality creative — hooks beyond mechanics

Mechanics get us a working share button. These hooks make the share *want to happen*.

**1. Destination-aware share image (locked).** 7 variants tied to highest level reached this session. Same player, multiple plays, multiple destinations, multiple shares. Compounds organically.

**2. Score milestone variants.** Inside each destination, score thresholds unlock different share image styling (e.g., bronze/silver/gold border, or "Trippie at the airport" vs "Trippie at the rooftop bar"). Three tiers per destination = up to 21 unique share images. Player who plays 5x produces 5 different shareable moments.

**3. "Loop 2 in Tokyo" bragging rights.** Players who hit the endless loop see a "Loop X" badge on the share image. Hard-earned signal that the game has depth. Drives replay among the most engaged users.

**4. Boarding pass collectibles.** At end of each session, the share image's bottom shows a row of stamped passport pages — one per destination cleared. Empty silhouettes for cities the player hasn't reached yet. Visible progression invites "fill the passport."

**5. Real-time score reinforcement.** Each chomp shows "+S$10" floating up. Cumulatively reinforces "I'm saving money playing this." When score hits S$500, the moment feels earned. The share moment lands harder because the number isn't abstract.

**6. The defeat hook.** Game-over isn't "you lost." It's "Tour cancelled — share to redeem your trip." Frames sharing as redemption, not bragging. Lowers the social-cost barrier of sharing a "loss."

**7. Friend handle leaderboard.** Optional handle entry on game-over. Pulls into a global top-100 list visible from the title screen. "@TerryP just hit S$3,200 in Bali" is a TikTok-able moment if the leaderboard is accessible/screenshot-able.

Cut from this list (creative session decision):
- Food-as-dots (visual noise, hurts maze readability)
- Festival overlays (too busy on top of fast Pac-Man play)
- Trippie outfit progression (out of scope for 8 days)
- Daily destination rotation (over-engineering)
- Ghost reframe to "travel pains" (cognitive load mid-game)
- Currency symbols on dots (readability cost)

---

## 4. Quality bar operationalized

Concrete pass/fail criteria, dimension by dimension.

| Dimension | Bar | Pass criteria |
|-----------|-----|---------------|
| **Load time** | <1.5s FCP on 4G | Total payload <2MB. WebP all bgs. Loading bar from t=0. |
| **Audio** | Punchy + thematic | Hybrid: real SFX (die, ghost-eat, power, dot pickup) + chiptune BGM. Mute button accessible. |
| **Visual feedback** | Every interaction has juice | Dot pickup: particle + floater. Power: full-screen flash. Ghost-eat: score popup + camera punch. Die: screen shake + slow-mo. |
| **Destinations** | Each feels distinct | 3-layer parallax bg per L. Palette shift on walls. Boarding pass card per transition. Optional regional sting. |
| **Share image** | Make people want to post | Trippie illustrated AT the destination. URL + #hashtag + @handle baked. Score milestone variants. Passport row at bottom. |
| **Replay loop** | Drives multiple plays | Endless after L7. Local high score visible. Different share variant each session. Loop counter on share. |
| **Score narrative** | "S$" feels real | Per-pickup floaters ("+S$10"). Power = "POWER SAVE +S$50". Monster = "FEE EATEN +S$200". |
| **Brand fit** | Feels like a YouTrip product | Type, palette, voice consistent with brand. Cheryl-and-Cass-IG-shareable test. |
| **Mobile UX** | iOS Safari + Android Chrome both work | Touch swipe responsive. Share sheet fires. Mute persists. HowToPlay button reachable on iPhone SE. |
| **Performance** | 60fps held on 2-yr-old phones | No frame drops on iPhone 12 / Galaxy S22-equivalent. Particle counts capped. |

If a dimension fails the bar, we cut it. We don't ship a half-version.

---

## 5. Decisions to lock before coding starts

Each is framed as: position + tradeoff + recommendation.

### Decision A — Giveaway entry mechanic (LOCKED)
**Position:** UTM-tagged URL + hashtag + @handle baked on share image. No email capture in-game.
**Why:** Acquisition path = friend sees share → taps URL → lands on signup page (UTM tracked). Email capture adds PDPA compliance + 4hr build cost; doesn't measurably improve entry rate. Hashtag/handle on image creates manual @-mention discovery as a soft secondary entry channel.
**Dependency:** Kelicia confirms campaign URL + hashtag + IG handle (`@youtrip` vs `@youtrip_sg`) before Sat morning. Drafted DM outside this doc.

### Decision B — Audio (PUSH HIGHER than agent's first pass)
**Position:** **Hybrid.** Real punchy SFX for the high-impact moments (die, ghost-eat, power pellet, dot pickup); keep procedural chiptune BGM.
**Why:** Pure procedural Web Audio oscillators won't satisfy "top-tier" — paying YouTrip users will read it as cheap. Hybrid keeps zero audio assets for the BGM (still 0KB) but lifts the moments that matter to "good game" tier. Free SFX from kenney.nl or freesound.org. Estimated +500KB total for 4-5 SFX files.
**Tradeoff considered:** Full audio replacement (option c) was tempting but risks audio sync regressions during the final weekend. Hybrid is the right balance for the timeline.
**Effort:** ~3 hrs total (curate samples, integrate into AudioSystem, replace `play()` cases for affected types).

### Decision C — Leaderboard (IN, not deferred)
**Position:** Global leaderboard with optional handle entry. Anonymous default ("Anonymous Trippie"). Backend on Supabase free tier (500MB DB, more than enough for top-100 by score).
**Why:** Existing-user-led campaign needs intra-community competition. Deferring to "v1.1" was the agent's safe-ship error — there is no v1.1 during the campaign window. 3-4hrs of Supabase work delivers measurable retention + a screenshot-able leaderboard moment.
**Anti-cheat:** Score capped at S$10K per submission (well above any legitimate game). Submission rate-limited per IP. Manual moderation if anyone abuses.

### Decision D — Hashtag / handle / URL (BLOCKED on Kelicia)
**Position:** Need confirmed by Thu Apr 30 EOD. Working assumptions:
- URL: `youtrip.com/travel-fund` (or whatever campaign LP path Cheryl is using)
- Hashtag: `#YouTripTravelFund` or `#TravelFundChallenge` (Kelicia's call)
- Handle: confirm `@youtrip` vs `@youtrip_sg`
**Risk if not confirmed:** Share image cannot be finalized until these are locked.

### Decision E — Visual style direction (PENDING validator)
**Position:** Run 3 Tokyo style variants Wed evening (parallel HQ session is doing this). Pick winning style Thu morning. Constraints:
- Visual quiet in maze center (~300×400 px area in middle)
- Strong contrast with `COLOR_WALL` 0x150D26
- Bottom 80px reasonably dark for HUD readability
- Mobile-readable at 480×720 native
**Tradeoff:** Style A (retro travel poster) = strongest brand fit, risks too "design-y." Style B (painterly anime) = highest emotional pull, risks "doesn't feel like a game." Style C (pixel art) = consistent with existing aesthetic, risks "8-bit feel" we're trying to push beyond.
**Recommendation:** lean Style A unless validator surfaces a clear winner otherwise.

### Decision F — Hosting + custom domain
**Position:** Cloudflare Pages with `*.pages.dev` URL as launch fallback. Initiate `play.youtrip.com` DNS request with YouTrip tech team in parallel.
**Why:** CF free tier is unlimited bandwidth (Vercel caps at 100GB/mo and could throttle mid-launch). DNS propagation can take 24-48hrs; if not initiated by Thu, custom domain won't be live by May 7. Pages.dev URL is acceptable for launch — clean, no setup.
**Privacy cutover:** Repo flips to private as the FINAL step (May 6 day-before), AFTER CF Pages is verified working. Sequencing matters: flipping private without CF live = game goes 404.

### Decision G — Score framing (LOCKED)
**Position:** "YOU SAVED S$[score]!" with explicit in-game education. Each pickup shows "+S$X saved" floater. Game-over reinforces with full sentence: "You saved S$2,400 from foreign fees!"
**Why:** Without real YouTrip user data (webview is anonymous), the S$ metaphor needs to be earned narratively in-game. Explicit per-pickup reinforcement makes the score number congruent with the rates value prop. Costs ~30 min, massive narrative coherence lift.

---

## 6. Weekend execution sequence — 16-24 hour ambition stack

Critical path. Each task has a time estimate and dependency flag. Order matters.

### Pre-weekend (Wed Apr 29 - Fri May 1)

1. **Wed evening:** Tokyo style validator (3 variants, $0.90, ~5 min via image_gen.py). Outputs to disk for review.
2. **Thu Apr 30 morning:** Pick winning style. Greenlight scaling to 7 destinations + 7 share image variants + parallax sprites (~$0.30 + agent time).
3. **Thu Apr 30:** Draft + send Slack DM to Kelicia for hashtag/URL/handle. Flag "needed before Sat AM."
4. **Thu Apr 30:** Initiate DNS request with YouTrip tech team for `play.youtrip.com` (deferred-to-launch, but start the clock).
5. **Thu Apr 30:** Set up Cloudflare account, verify access to YouTrip-Marketing GitHub org. Don't deploy CF Pages yet.
6. **Fri May 1 (Labour Day light prep):** Confirm all assets generated. Final review of PLAN.md. Hand to `trippie-game-dev` agent for execution-time prep (build environment, npm install, etc.).

### Saturday (8 hrs — code execution begins)

**Block 1 (2 hrs) — Cleanup + asset baseline:**
1. **(15min)** Delete `game-bg.png` and `start-screen.png`. Remove `game-bg` from PreloadScene load. Verify nothing breaks.
2. **(45min)** WebP convert all production assets. Replace existing PNGs. Update load extensions. Confirm share image generator (Canvas 2D) reads WebP source images correctly on mobile.
3. **(30min)** Integrate `levels.ts` LevelConfig + getLevelConfig resolver into GameScene. Wire level-indexed config lookup.
4. **(30min)** Loading bar in PreloadScene with progress events. Black-canvas anxiety eliminated.

**Block 2 (2 hrs) — Boarding pass + level transitions:**
5. **(30min)** Boarding pass scene: 2-second card slide-in, city/flag swap from getLevelConfig. Ambient "boarding zone" SFX (cut if no time).
6. **(30min)** Background animation system — `BackgroundAnimator` accepts 3 parallax layer configs from LevelConfig. Lightweight tweened sprite movement, decorative only.
7. **(60min)** Per-destination palette + parallax layer integration. Level transitions verified for all 7 destinations.

**Block 3 (2 hrs) — Game feel + score narrative:**
8. **(5min)** Screen shake on death: `this.cameras.main.shake(300, 0.015)` — 1 line.
9. **(30min)** Score floaters: each pickup shows "+S$X" tween at pickup position, alpha 1→0, y -= 40px over 800ms. Reuse popup pool.
10. **(30min)** Power pellet particle burst: 12-16 golden particles, 600ms lifespan. Phaser built-in particle emitter.
11. **(30min)** Ghost-eat camera punch zoom + score popup at ghost position.
12. **(15min)** Game-over copy update: "YOU SAVED S$X" → "YOU SAVED S$X FROM FOREIGN FEES!" + destination context.
13. **(10min)** Mute button in HUD with localStorage persistence.

**Block 4 (2 hrs) — Audio hybrid + share polish:**
14. **(60min)** Audio hybrid: source 4-5 free SFX (die, ghost-eat, power, dot, click) from kenney.nl. Integrate via AudioSystem `play()` switch — keep procedural fallback for any unfound types. BGM stays procedural.
15. **(30min)** Share image v2: destination-aware variants (Trippie at the city). 7 base variants, score-tier modifier (bronze/silver/gold border). URL + hashtag + handle baked.
16. **(20min)** Passport row on share image: 7 destination silhouettes, filled for cities reached.
17. **(10min)** Loop counter on share image when player is past L7.

### Sunday (6-8 hrs — leaderboard + polish + deploy)

**Block 5 (3 hrs) — Global leaderboard:**
18. **(30min)** Supabase project setup. Free tier. Create `leaderboard` table (id, handle, score, destination, created_at).
19. **(45min)** Score submission endpoint + handle entry UI on game-over.
20. **(45min)** Top-100 leaderboard scene accessible from title. Pagination if needed.
21. **(60min)** Anti-cheat: client-side score cap at S$10K, server-side rate limit per IP.

**Block 6 (2-3 hrs) — Polish + bug fixes:**
22. Teleport bug fix: reset player.dir + nextDir after teleport.
23. HowToPlay scene scroll fix: compress vertical spacing to fit iPhone SE height.
24. Ghost sprite variants: if time, generate 2 more ghost sprites (patrol/shy distinct visuals). Skip if running tight.
25. Title screen polish: typography pass, hero image, "Play" button feels tactile.

**Block 7 (1-2 hrs) — Analytics + final mobile QA:**
26. GA4 with 5 events: `game_start`, `game_over`, `level_reached`, `share_clicked`, `share_completed`. Property ID locked Friday.
27. Mobile QA: iOS Safari + Android Chrome on real devices. Test golden path + each share variant + leaderboard submit.

### Monday-Tuesday (May 4-5 — final tuning, no major work)

- Burn-in playtest. Friends/family test.
- Performance tuning if any frame drops surface.
- Bug fixes from QA.
- Final share image copy review with Kelicia.

### Wednesday May 6 — cutover day

- Set up Cloudflare Pages project, connect to repo, configure build (`npm run build` → `dist`).
- Verify CF URL works on mobile + desktop. Test share generation. Test all 7 destinations.
- Notify Kelicia + anyone with old GH Pages URL to switch to CF URL.
- **Flip repo to private** in YouTrip-Marketing settings.
- Disable GH Pages.
- Old `youtrip-marketing.github.io/...` → 404 (expected, not load-bearing).
- 24h burn-in window before launch.

### Thursday May 7 — launch

- KOL trio publishes on schedule.
- OOH stunt teaser already running (May 2-3 prior).
- In-app campaign module text-box link goes live.
- GA4 + leaderboard monitored hourly first 6hrs.

---

## 7. 4-hour contingency stack — if life happens

If you only get 4 hours total this weekend, ship in this order:

**Hour 1 — Asset + share basics:**
1. Delete dead assets (15min)
2. WebP convert + integrate (30min)
3. Share image URL + hashtag + handle baked (15min)

**Hour 2 — Game feel + analytics:**
4. Screen shake on death (5min)
5. Mute button (25min)
6. GA4 with 5 events (30min)

**Hour 3 — Boarding pass + score floaters:**
7. Boarding pass scene (30min)
8. Score floaters per pickup (30min)

**Hour 4 — CF Pages cutover:**
9. CF Pages deploy + smoke test (60min)

At 4 hours: skip leaderboard, skip per-destination palettes, skip particle bursts, skip audio hybrid, skip share image variants. Game ships with the locked creative SPINE (boarding pass + destination intent) but without full polish payoff.

This is the safety net. Aim for the full 16-24hr stack.

---

## 8. Risks, unknowns, outside-repo dependencies

### Repo-controlled risks

- **WebP + Canvas 2D edge case.** ShareImage.ts uses `textures.get('game-over-bg').getSourceImage()` — Phaser loads WebP fine, but some mobile browsers' Canvas2D `drawImage()` can choke. **Mitigation:** test share generation on iOS Safari + Android Chrome explicitly after WebP conversion. Fallback: keep one PNG version of the share-bg specifically for share generation if WebP fails.
- **Particle performance regression on older Android.** 12-16 particles per power pellet on cheap Android could frame-drop. **Mitigation:** cap particle count; profile on a 2-yr-old Galaxy if possible.
- **Audio sample sync.** Replacing oscillators with samples can introduce delay if not careful. **Mitigation:** preload all SFX in PreloadScene, use Phaser sound manager (not raw Audio elements), test on iOS where AudioContext is finicky.
- **Leaderboard abuse.** Bored teenager submits 99,999. **Mitigation:** client cap at S$10K, IP rate limit, manual moderation if needed. Worst case: drop the leaderboard from the build if Sunday execution slips.

### Outside-repo dependencies

- **Hashtag / URL / handle from Kelicia** — share image cannot be finalized until locked. Drafted DM separately.
- **Campaign LP exists and works** — the URL on the share image must lead somewhere. Confirm with Cheryl by Thu. If LP isn't ready, point to `youtrip.com` homepage with a UTM param as fallback.
- **DNS for `play.youtrip.com`** — if not initiated this week, won't be live by May 7. **Fallback:** `*.pages.dev` URL is fully acceptable for launch.
- **GA4 property** — needs to exist. Either reuse YouTrip's main property or create a dedicated one for the campaign. Confirm with Cheryl.
- **T&Cs for the giveaway** — "stand a chance to win a year of travel" is a contest. Singapore requires published T&Cs. The campaign LP must host them. Marketing/legal dependency. If unresolved, may need to soften CTA copy.
- **In-app entry point in YouTrip's campaign module** — Kelicia owns this. Confirm she's added the URL to the text box before May 7.
- **Image generation pipeline (image_gen.py)** — depends on Gemini + OpenAI API access. Cost ~$3-5 total for all assets. Already verified working.

### Things that should NOT block launch

- Custom domain (pages.dev is fine)
- Per-region audio stings (chiptune-only is acceptable)
- Ghost sprite variants for patrol/shy (current visuals are workable)
- Easter eggs / Trippie outfit unlocks (out of scope by design)

---

## 9. Owner map

- **Terry (Sat-Sun May 2-3):** All code execution. Driving the build personally.
- **trippie-game-dev agent:** Execution-time pair partner during the weekend. Code-level task expansion against this PLAN. Pre-weekend prep (env, deps, scaffolding).
- **HQ (me):** Plan ownership, decision support, asset coordination, Slack drafts, post-weekend retro.
- **Kelicia:** Hashtag, URL, IG handle, in-app entry point integration. Drafted DM going to her separately.
- **Cheryl:** Campaign LP confirmation, T&Cs link, share image final copy review.
- **YouTrip tech team:** DNS for `play.youtrip.com` (parallel ask, not blocking).
- **Image gen (other HQ session):** All 7 destination bgs + 7 share image variants + parallax sprites by Thu PM.

---

## 10. Definition of done

Game ships May 7 if and only if:

- [ ] All 7 destinations playable, each with custom bg + parallax + boarding pass
- [ ] Share image generates correctly, 7 destination-aware variants, URL + hashtag + handle baked
- [ ] GA4 firing 5 events
- [ ] Leaderboard live with anti-cheat (or explicitly cut with Terry signoff)
- [ ] Mute button works, persists across sessions
- [ ] Screen shake + score floaters + particle bursts on power
- [ ] Audio hybrid: real SFX for high-impact moments + chiptune BGM
- [ ] CF Pages deployment serving public URL
- [ ] Repo private, GH Pages disabled
- [ ] Mobile QA pass on iOS Safari + Android Chrome
- [ ] Total payload <2MB
- [ ] iPhone SE QA pass (HowToPlay button reachable, game playable)

If any of these fail by Tue May 5 EOD, escalate to Terry for cut/defer decision. No half-versions ship.

---

## 11. Files & references

- **This doc:** `~/projects/youtrip-trippie-chomp/PLAN.md`
- **Creative direction:** `~/projects/youtrip-trippie-chomp/CREATIVE-BRIEF.md` (locked)
- **Per-destination copy:** `~/projects/youtrip-trippie-chomp/COPY.md`
- **Level config:** `~/projects/youtrip-trippie-chomp/src/config/levels.ts` (drafted)
- **Repo:** `~/projects/youtrip-trippie-chomp/` — github.com/YouTrip-Marketing/youtrip-trippie-chomp
- **Live game (current):** https://youtrip-marketing.github.io/youtrip-trippie-chomp/
- **Image gen helper:** `~/life/marketing-org/shared/integrations/image_gen.py`
- **Memory framing:** `~/.claude/projects/-Users-terrypang-life-marketing-org-hq/memory/project_travel_fund_game.md`

---

*Locked by HQ 2026-04-29. The trippie-game-dev agent expands sections 6 + 8 into code-level tasks against this document. Decisions in section 5 are not re-litigated without HQ + Terry signoff.*
