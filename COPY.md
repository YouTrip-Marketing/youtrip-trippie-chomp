# Trippie Chomp — Per-Level Copy

All copy strings, organized per level. Single source of truth for boarding pass cards, share images, level intro popups, and audio sting cues. Hand to dev with `levels.ts`.

---

## Boarding pass card (between-level interstitial)

2-second card shown before each level (including L1). Template:

```
┌────────────────────────────────────┐
│  ✈  YOUTRIP AIRWAYS                │
│                                    │
│  NOW BOARDING                      │
│                                    │
│  [CITY NAME]   [FLAG]              │
│  [CITY CODE]                       │
│                                    │
│  GATE  03    SEAT  TRIPPIE-{LEVEL} │
└────────────────────────────────────┘
```

Per-level data lives in `src/config/levels.ts` → `cityCode`, `destination`, `flag`. Subtitle line varies:

| Level | Subtitle |
|-------|----------|
| L1 SIN | "Departure — your world tour begins" |
| L2 TYO | "First stop — Tokyo, Japan" |
| L3 BKK | "Next stop — Bangkok, Thailand" |
| L4 SEL | "Next stop — Seoul, Korea" |
| L5 KUL | "Next stop — Kuala Lumpur, Malaysia" |
| L6 NYC | "Next stop — New York, USA" |
| L7 DPS | "Final stop — Bali, Indonesia" |
| L8+ | "Loop {N}: returning to [CITY]" |

---

## Share image headlines

1080×1920 IG Story. Hero image = Trippie illustrated at the destination. Headline + stat block + footer.

| Level | Headline | Sub-line |
|-------|----------|----------|
| L1 SIN | "Trippie boarded the world tour" | "Saved S${score} so far" |
| L2 TYO | "Trippie made it to Tokyo" | "Saved S${score} on the way" |
| L3 BKK | "Trippie made it to Bangkok" | "Saved S${score} on the way" |
| L4 SEL | "Trippie made it to Seoul" | "Saved S${score} on the way" |
| L5 KUL | "Trippie made it to Kuala Lumpur" | "Saved S${score} on the way" |
| L6 NYC | "Trippie made it to New York" | "Saved S${score} on the way" |
| L7 DPS | "Trippie made it to Bali" | "Saved S${score} on the way" |
| Loop 1+ | "Trippie did it all again" | "{N} laps · S${score} saved" |

**Footer (every share image):**
```
Play at [URL]   #[HASHTAG]   @[HANDLE]
```

URL/hashtag/handle TBD — pull from Kelicia (campaign hashtag) and Cheryl/Kelicia (landing page URL). Verify @youtrip vs @youtrip_sg before final.

---

## Level intro popup (in-game, optional 1-sec flash)

If we keep a brief in-game text flash on level start (after the boarding pass card dismisses), use the destination name only:

| Level | Popup |
|-------|-------|
| L1 | "WELCOME ABOARD" |
| L2 | "TOKYO" |
| L3 | "BANGKOK" |
| L4 | "SEOUL" |
| L5 | "KUALA LUMPUR" |
| L6 | "NEW YORK" |
| L7 | "BALI" |

Pixel font, big, fades out in 1 sec. Keeps the destination name on-screen briefly even after the boarding card transitions to gameplay.

---

## Game over screen (existing — unchanged)

Existing copy stays:
- "YOU SAVED S${score}!"
- Sub: "Beat {N} fee monsters · Reached {destination}"
- CTA: "Share to enter — win a year of travel"

The "Reached {destination}" line should pull from the highest level reached and show the destination name (eg. "Reached Bali" if they cleared L7).

---

## Audio sting cues

Optional. Drop entirely if time runs out — game already has chiptune ambient. If included, 3-sec sting plays on level-start fade-in only:

| Level | Sting | Description |
|-------|-------|-------------|
| L1 SIN | sting-airport | Soft chime + ambient hush (gate announcement vibe) |
| L2 TYO | sting-jp-koto | 3-note koto pluck |
| L3 BKK | sting-th-gong | Soft gong + bamboo flute trill |
| L4 SEL | sting-kr-synth | K-pop synth riser |
| L5 KUL | sting-my-gamelan | Gamelan bell motif |
| L6 NYC | sting-us-horn | Single taxi honk + jazz piano stab |
| L7 DPS | sting-id-gamelan | Bali gamelan tremolo + soft surf |

Keep stings under 3 sec, low volume, layered under existing chiptune. Should feel like a flavor seasoning, not a soundtrack swap.
