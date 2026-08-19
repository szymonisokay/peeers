# Design — sources of truth

## Mockups

`assets/design/*.png` — 41 files numbered `01`–`42`, plus the extra variant
`02b`. The gap at `30` and `31` is intentional (they were logo variants).

The mockups are the UI spec: when the code disagrees with a mockup, assume the
code is wrong — except for the defects listed at the bottom of this file.

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
| `assets/icons/` | 22 icons, 24×24, `stroke-width="1.9"`, `currentColor` |
| `assets/logo/` | the mark in 3 variants |
| `assets/illustrations/` | empty-state illustrations, one light and one dark file per name |

Keep new icons to the same convention: 24×24, `currentColor`, 1.9 stroke,
round caps.

Illustrations carry their own colours instead of `currentColor`, so each needs
a light and a dark file and is used through `src/components/Illustration.tsx`,
which picks by scheme. Derive a dark variant rather than eyeballing it: mirror
each stroke's oklch lightness around the surface token. `pusta-lista` was built
that way — a stroke sitting 0.10 below white sits 0.10 above `#1B1E25` in the
dark file — and its card fill and accent map straight onto the `surface` and
dark `accent` tokens.

**Never use `oklch()` in an SVG asset.** `react-native-svg` cannot parse it and
the shape renders blank with no error. Write colours as hex. The design spec is
kept in oklch, so convert on the way into an asset —
`assets/illustrations/pusta-lista.svg` had to be converted after the fact.

Import them through `src/components/Icon.tsx`, which maps a name to a component
and forwards `color`; every icon uses `currentColor`, so passing `color` is
enough to recolour it. Imports there are static because Metro cannot bundle a
path built at runtime.

Editing `metro.config.js` requires a dev-server restart with `--clear`; Metro
does not reload its own config, and `.svg` silently falls back to being a static
asset, which surfaces as "Element type is invalid ... but got: number".

### What is missing

Five of the six icons added in M1 (`chevron-prawo`, `chevron-lewo`,
`strzalka-dol`, `plus`, `strzalka-w-gore`) are geometric reconstructions rather
than traces from the mockups. They read correctly at 24 pt but were not
pixel-matched.

Illustrations: only `pusta-lista` exists, in both themes. Still unillustrated:
the empty feed of a fresh Przestrzeń, an empty note list, no search results, an
empty archive.

The app icon and splash screen are still the default Expo assets — to be
replaced at the end.

Importing `.svg` as components works through `react-native-svg-transformer`,
configured in `metro.config.js`.

## Motion

Timings and spring parameters live in the `motion` block of
`src/theme/tokens.ts` and are read through `useTheme()`. They are the one part
of the design system **not** measured from the mockups, which are static — treat
them as a vocabulary to reuse rather than to re-pick per component.

Animate only state changes the user caused. Cards, labels and screen entry stay
still; sheets and `Toggle` keep their native behaviour; screen transitions
belong to the navigator.

Every animated component must honour `useReducedMotion()` from `src/hooks`.
When the OS asks for reduced motion the animation must not play at all, not
merely run shorter. Note that writing the simulator's accessibility plist has no
effect on a running device and `simctl ui` cannot set it — toggle it in
Settings → Dostępność → Ruch. The gallery header shows the current value.

## Known mockup defects

Do not "fix" the code to match these.

| Screens | Discrepancy |
|---|---|
| `03`, `07`, `20`, `27` vs `35`, `38` | "Biedronka, sobota" shows either `2 z 8` or `2 z 6` |
| `09` vs `10`, `40` | the note "Kod do bramy i wifi": "widzą 3 osoby" vs "widoczne dla 2 osób" |
| `03` vs `35`, `38` | the same "3 items added" event is attributed to Nina at 11:07 and to Kuba at 17:05 |
| `09` vs `14` | `09` shows a note hidden from Ala in a list viewed as Ala, while `14` states a hidden note does not appear for that person |
| `34` | greys out taken avatar colors — contradicts the decision to keep colors global and unblocked |
