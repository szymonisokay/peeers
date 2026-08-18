# Design — sources of truth

## Mockups

`assets/design/*.png` — 42 screens numbered `01`–`42`. The gap at `30` and `31`
is intentional (they were logo variants). The mockups are the UI spec: when the
code disagrees with a mockup, assume the code is wrong — except for the defects
listed at the bottom of this file.

Dark variants: `38` (feed), `39` (list), `40` (note).

## Tokens

**`src/theme/tokens.ts` is canonical.** Do not write colors, spacing or text
sizes directly into components — take them from `useTheme()`.

Where the values come from:

- the light-theme colors (`background`, `border`, `accent`, `text`) come from
  the design spec given in oklch; the hex codes in the file are its exact sRGB
  equivalent,
- everything else (`textMuted`, `danger`, `success`, `warning*`, and the whole
  dark theme) was **measured from mockup pixels**; each token carries a comment
  naming the screen it came from,
- the dark-theme semantic colors (`danger`, `success`, `warning*`) are the only
  hand-derived values — the mockups do not show them.

If you need a color that is not in the tokens: measure it from the mockup
rather than picking by eye, and add it to `tokens.ts` with a source annotation.

The accent differs between themes — `#505AC8` in light, `#7787F3` in dark.

## Typography

Public Sans from `@expo-google-fonts/public-sans`, weights 400/500/600/700,
loaded in `src/app/_layout.tsx`. The scale lives in `typography` in
`tokens.ts`.

Labels use `letterSpacing: 0.88` — that is `.08em` resolved against 11 px,
because React Native does not accept relative units.

## Assets

| Directory | Contents |
|---|---|
| `assets/icons/` | 16 icons, 24×24, `stroke-width="1.9"`, `currentColor` |
| `assets/logo/` | the mark in 3 variants |
| `assets/illustrations/` | empty-state illustrations |

Keep new icons to the same convention: 24×24, `currentColor`, 1.9 stroke,
round caps.

### What is missing

Icons used in the mockups but absent from the set: `chevron-prawo`,
`chevron-lewo`, `plus`, `strzalka-w-gore`, `wiecej` (⋯), `strzalka-dol`.

Illustrations: only `pusta-lista` exists. Still unillustrated: the empty feed of
a fresh Przestrzeń, an empty note list, no search results, an empty archive.

The app icon and splash screen are still the default Expo assets — to be
replaced at the end.

Importing `.svg` as components requires `react-native-svg-transformer` and an
entry in `metro.config.js`. `react-native-svg` is installed; the transformer is
not.

## Known mockup defects

Do not "fix" the code to match these.

| Screens | Discrepancy |
|---|---|
| `03`, `07`, `20`, `27` vs `35`, `38` | "Biedronka, sobota" shows either `2 z 8` or `2 z 6` |
| `09` vs `10`, `40` | the note "Kod do bramy i wifi": "widzą 3 osoby" vs "widoczne dla 2 osób" |
| `03` vs `35`, `38` | the same "3 items added" event is attributed to Nina at 11:07 and to Kuba at 17:05 |
| `09` vs `14` | `09` shows a note hidden from Ala in a list viewed as Ala, while `14` states a hidden note does not appear for that person |
| `34` | greys out taken avatar colors — contradicts the decision to keep colors global and unblocked |
