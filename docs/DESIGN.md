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
  hand-derived values — the mockups do not show them,
- `shadow.raisedButton` was **fitted** rather than sampled: a shadow has no
  single pixel to read. The luminance falloff around the raised tab-bar button
  in `03` and `38` was sampled in four directions and matched against a
  blurred disc, giving an 8 pt downward offset, a CSS blur of 18 px and no
  spread. Only the opacity differs between themes (0.16 light, 0.43 dark).

If you need a color that is not in the tokens: measure it from the mockup
rather than picking by eye, and add it to `tokens.ts` with a source annotation.

The accent differs between themes — `#505AC8` in light, `#7787F3` in dark.

## Typography

Public Sans from `@expo-google-fonts/public-sans`, weights 400/500/600/700,
loaded in `src/app/_layout.tsx`. The scale lives in `typography` in
`tokens.ts`.

Labels use `letterSpacing: 0.88` — that is `.08em` resolved against 11 px,
because React Native does not accept relative units.

`caption` (12 px) is the secondary line under a title, as in the option cards
on `05`. It is a genuinely smaller step than `bodySmall` (15 px), not a
substitute for it — using `bodySmall` there makes the subtitle wrap where the
mockup keeps it on one line.

**Sizing text by eye does not work.** Two independent measurements should agree
before you pick a size: the x-height in the mockup, and the rendered width of a
known string. For `05` both landed on 12 px.

## Assets

| Directory | Contents |
|---|---|
| `assets/icons/` | 22 icons, 24×24, `stroke-width="1.9"`, `currentColor` |
| `assets/logo/` | the mark in 3 variants |
| `assets/illustrations/` | empty-state illustrations, one light and one dark file per name |

Keep new icons to the same convention: 24×24, `currentColor`, 1.9 stroke,
round caps. **File names are English**, unlike the mockups in `assets/design/`,
which keep their Polish export names and are referred to by number anyway. Name
by shape, not by use: `chevron-down` is a chevron used as a dropdown caret,
while `arrow-up` has a shaft — they are different drawings despite similar
names in the original set.

Illustrations carry their own colours instead of `currentColor`, so each needs
a light and a dark file and is used through `src/components/Illustration.tsx`,
which picks by scheme. Derive a dark variant rather than eyeballing it: mirror
each stroke's oklch lightness around the surface token. `empty-list` was built
that way — a stroke sitting 0.10 below white sits 0.10 above `#1B1E25` in the
dark file — and its card fill and accent map straight onto the `surface` and
dark `accent` tokens.

**Never use `oklch()` in an SVG asset.** `react-native-svg` cannot parse it and
the shape renders blank with no error. Write colours as hex. The design spec is
kept in oklch, so convert on the way into an asset —
`assets/illustrations/empty-list.svg` had to be converted after the fact.

Import them through `src/components/Icon.tsx`, which maps a name to a component
and forwards `color`; every icon uses `currentColor`, so passing `color` is
enough to recolour it. Imports there are static because Metro cannot bundle a
path built at runtime.

Editing `metro.config.js` requires a dev-server restart with `--clear`; Metro
does not reload its own config, and `.svg` silently falls back to being a static
asset, which surfaces as "Element type is invalid ... but got: number".

### What is missing

Five of the six icons added in M1 (`chevron-right`, `chevron-left`,
`chevron-down`, `plus`, `arrow-up`) are geometric reconstructions rather than
traces from the mockups. They read correctly at 24 pt but were not
pixel-matched.

Illustrations: only `empty-list` exists, in both themes. Still unillustrated:
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

## Android

**Every mockup is iOS.** There is no Android reference for any screen, so
anything Android-specific is a judgement call, not a measurement — say so when
you add one. Two are already in the code:

- the tab bar takes its lower breathing room from the home-indicator inset,
  which on iOS is ours to paint and is where the raised button's shadow
  falls. Android takes that region back: the navigation bar's contrast scrim
  paints over it, and measured on API 37 the shadow died 2 dp below the
  button — visible to the sides and above, gone underneath. `TabBar`
  therefore floors the inset at `spacing.sm` so the bar is never flush, and
  adds `spacing.lg` on Android to lift the button off the scrim. The shadow
  reaches 26 dp below the button, so the tail of it is still trimmed — that is
  a deliberate choice of proportion over completeness,
- `formSheet` is a Material bottom sheet on Android, not a UIKit sheet. The
  8 pt inset described below is iOS-only, and the `sheet*` options behave
  differently: Android accepts at most three detents, and `fitToContents`
  derives its height from the laid-out content wrapper rather than from a
  detent fraction.

`fitToContents` does not survive that difference. Observed in Expo Go on
Android: the content wrapper measures 0, so the sheet opens as a bare strip of
the dialog's own white background — no content, and no dimming either, because
Android fades the dimming view in proportion to how far the sheet has opened.
The `new` route therefore passes a fraction detent on Android and keeps
`fitToContents` on iOS, where the measurement does work. The fraction is the
mockup's proportion rather than an Android measurement: 309 pt of 874 in `05`,
rounded up to `0.36`.

Do not give sheet content a fixed height to work around a sheet that is the
wrong size. It defeats `fitToContents` on iOS, where the sheet measures
correctly, and on Android it does not help — the wrapper still reports 0.

Android also draws the sheet with square corners unless `sheetCornerRadius` is
set, because the content wrapper fills the sheet and paints over whatever
rounding the dialog had. It is set to the 22 pt measured from `05`, which
applies on both platforms — unlike the 8 pt inset below, a corner radius *is*
controllable, so the mockup wins over the iOS system default of roughly 40 pt.

## Known mockup defects

Do not "fix" the code to match these.

| Screens | Discrepancy |
|---|---|
| `03`, `07`, `20`, `27` vs `35`, `38` | "Biedronka, sobota" shows either `2 z 8` or `2 z 6` |
| `09` vs `10`, `40` | the note "Kod do bramy i wifi": "widzą 3 osoby" vs "widoczne dla 2 osób" |
| `03` vs `35`, `38` | the same "3 items added" event is attributed to Nina at 11:07 and to Kuba at 17:05 |
| `09` vs `14` | `09` shows a note hidden from Ala in a list viewed as Ala, while `14` states a hidden note does not appear for that person |
| `34` | greys out taken avatar colors — contradicts the decision to keep colors global and unblocked |
| `05` | draws the sheet flush with the screen edges — iOS 26 insets every sheet by 8 pt, see below |
| `03` vs `07` | the feed card reads "Nina dopisał(-a) 3 rzeczy" and names *kawa ziarnista · ziemniaki 2 kg · worki 60 l*, but `07` holds the first two and no "worki 60 l", and counts eight rows |

### Sheet insets

`05` draws the "Co tworzymy" sheet edge to edge: 0 pt left, right and bottom,
only the top corners rounded. On iOS 26 a `formSheet` is drawn inset by **8 pt**
on those three sides — measured on iPhone 17 / iOS 26.4, where the sheet is
386 pt wide on a 402 pt screen. That margin is the system appearance, not
something the app sets: `react-native-screens` exposes ten `sheet*` options and
none of them controls it, and UIKit has no such property either.

`pageSheet` does render edge to edge, but `react-native-screens` applies the
`sheet*` options to `formSheet` only, so switching also discards
`sheetAllowedDetents: 'fitToContents'` and the grabber — the sheet then opens
near full height instead of hugging its content. Matching the mockup exactly
would mean building a custom sheet on `transparentModal`.

**Decision: keep the 8 pt.** For a native modal, matching the current OS beats
matching a drawing made before the OS changed. This holds for every sheet in
the app, not just `05`.
