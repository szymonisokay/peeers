# Build the navigation shell: tab bar, routes and the sheet pattern

**IMPLEMENTER INSTRUCTION: Keep this plan up to date as you work.**
After each significant step, update the `Progress` section with what was done and what's next. If context is lost or you are interrupted, the plan must contain everything needed to resume. Treat the plan as the single source of truth for this work.

This ExecPlan is a living document. The sections `Progress`, `Surprises &
Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept
up to date as work proceeds.

Reference: This plan follows conventions from AGENTS.md (root),
docs/PROJECT.md, docs/DESIGN.md, and docs/exec-plans/create-plan-file.md.
It implements milestone M2 from docs/ROADMAP.md.

## Purpose / Big Picture

The app currently has one throwaway screen and a component gallery. There is no
way to move around it.

After this change the app has its real shape: a five-slot tab bar matching the
mockups — Przestrzeń, Zakupy, a raised `+`, Notatki, Ty — where every tab leads
somewhere, detail screens push over the tab bar and hide it, and the `+` opens a
bottom sheet. Every destination is a labelled stub, so nothing displays real
data yet.

You can see it by opening the app and tapping every tab, pushing into a detail
screen and coming back, and opening the `+` sheet and dismissing it by dragging
down.

The point is that M4 onward only fills screens in. Nobody has to decide
navigation structure again while also building a feature.

## Bird's Eye View

Route tree after this change:

    src/app/
      _layout.tsx            root Stack — owns everything below
      (tabs)/
        _layout.tsx          Tabs with a custom tab bar
        index.tsx            Przestrzeń — feed          (03)
        lists.tsx            Zakupy                     (35)
        notes.tsx            Notatki                    (09)
        profile.tsx          Ty                         (13)
      list/[id].tsx          list detail — pushed, no tab bar   (07)
      note/[id].tsx          note detail — pushed, no tab bar   (10)
      new.tsx                "Co tworzymy" — formSheet          (05)
      gallery.tsx            component gallery (already exists)

Two presentation modes, and which one a screen uses is decided by the mockup:

    tab screen                 pushed screen              sheet
    +-------------------+      +-------------------+      +-------------------+
    |                   |      | < Mieszkanie 14   |      |                   |
    |     content       |      |                   |      |     content       |
    |                   |      |     content       |      +-------------------+
    +-------------------+      |                   |      |   dimmed parent   |
    | [] [] (+) [] []   |      | [ add item... ]   |      | [] [] (+) [] []   |
    +-------------------+      +-------------------+      +-------------------+
      tab bar visible            tab bar hidden             sheet over parent
      03, 35, 09, 13             07, 10, 17                 05, and later 04,
                                                            06, 12, 14, 19,
                                                            24, 28, 37

Key changes:

| ADDED | UNCHANGED | REMOVED |
|---|---|---|
| `(tabs)/` group and four tab screens | every primitive from M1 | placeholder body of `src/app/index.tsx` |
| custom `TabBar` component | `src/theme`, `src/hooks` | — |
| `list/[id]`, `note/[id]` stubs | `gallery.tsx` | — |
| `new.tsx` as a `formSheet` route | | |

Navigating from the feed to a list:

    (tabs)/index  --router.push('/list/1')-->  list/[id]
         |                                          |
      tab bar visible                          tab bar hidden,
                                               back link to the parent

## Assumptions

- `Tabs` from `expo-router` accepts a custom `tabBar` render prop. Verified
  against the installed types: `tabBar?: (props: BottomTabBarProps) => React.ReactNode`
  in `expo-router/build/react-navigation/bottom-tabs/types.d.ts`.
- `presentation: 'formSheet'` with `sheetAllowedDetents: 'fitToContents'` works
  on both platforms. Verified against the installed types during M1 planning;
  **confirm at runtime in step 3**.
- Stub screens need no data layer. They render their own name and a link or two,
  nothing more. M3 brings the data.

## Open Questions

- Does the feed tab keep its own scroll position when you return from a pushed
  detail screen? Expected yes, but worth confirming in step 4 — it affects
  whether M4 needs to do anything about it.

## Progress

- [x] (2026-08-19 12:20Z) Step 1 — `(tabs)` group with four stub screens;
  `src/app/index.tsx` removed, the feed tab replaces it.
- [x] (2026-08-19 12:24Z) Step 2 — `src/components/TabBar.tsx`, geometry
  measured from `13` into a `tabBar` token block.
- [x] (2026-08-19 12:26Z) Step 3 — `new.tsx` as `formSheet` with
  `fitToContents`; the raised `+` pushes to it.
- [x] (2026-08-19 12:27Z) Step 4 — `list/[id]` and `note/[id]` push over the
  tab shell with the bar hidden and a back link as in `07`.

## Surprises & Discoveries

- Observation: the acceptance criterion in step 3 was wrong. It said the tab bar
  should "stay visible behind the dimmed parent". It does not, and cannot — a
  `formSheet` occupies the bottom of the screen, which is exactly where the bar
  is. Mockup `05` shows the same thing. Corrected here rather than chased.

- Observation: the simulator renders at @3x (1206x2622 for a 402x874 screen)
  while the mockups are @2x. A first comparison of the tab bar reported the
  raised button as 78 pt against the mockup's 52 pt; the button was correct and
  the scale assumption was not.
  Evidence: after deriving scale from `width / 402` per image, both measured
  52.0 pt diameter, with vertical placement within 1.5 pt of the mockup.

- Observation: detail screens use the native stack header, which paints a
  surface-coloured bar; `07` has the back link sitting on the screen background
  with no header chrome. Left as is — these are stubs and M4 styles the real
  screen.

- Observation: the first version of the `new` sheet did not match `05`, because
  it was built from this plan's prose rather than from the mockup — the mockup
  was never opened while implementing it. Five things were wrong: two rows in a
  shared card instead of two separate cards, no tinted highlight on the first
  option, bare icons instead of filled tiles, no "Anuluj", and **invented UI
  copy**. The last one breaks AGENTS.md constraint 3 outright: the mockup says
  "Wspólna lista, każdy odhacza po swojemu" and "Tekst albo checklista,
  wybierasz kto widzi"; both subtitles had been written by hand.
  Fixed by measuring `05`: added `selectedSurface`, `selectedBorder` and
  `tileFill` tokens (light measured, dark mirrored around the surface), and a
  `caption` typography step at 12 px.

- Observation: the sheet's subtitle wrapped where the mockup keeps it on one
  line, and the first guess — that the text area was ~2 pt too narrow — was
  wrong.
  Evidence: the mockup renders the string in 230 pt while `bodySmall` needs over
  278 pt, and the mockup's x-height is 6.5 pt against roughly 8 pt at 15 px.
  Both point at 12 px, so the cause was a missing step in the type scale, not
  layout. Comparing average character width between two different strings was
  what produced the wrong first answer — different letters, different widths.

- Observation: a drop shadow cannot be read off a single pixel. The raised
  button's shadow was **fitted**: the luminance falloff around it in `03` and
  `38` was sampled in four directions and matched against a blurred disc,
  giving an 8 pt downward offset, an 18 px CSS blur and no spread.
  Evidence: the fit predicted a 0.024 drop directly above the button, where
  measurement gave 0.024 — an axis that was never fitted.

- Observation: iOS 26 insets every sheet by 8 pt on three sides, which `05`
  does not draw. Neither `react-native-screens` nor UIKit exposes that margin.
  Kept, and recorded in DESIGN.md as a platform discrepancy.

- Observation: the same sheet was invisible on Android — a bare white strip.
  The cause was neither the content (a plain red box was equally invisible) nor
  `formSheet` (a `modal` behaved the same) nor the detent fraction.
  Evidence: on Android 13 the app window stopped at 866.3 dp of a 914.3 dp
  screen. Expo Go's window is not edge-to-edge, and `react-native-screens`
  sizes sheets against one that is. A development build sets
  `edgeToEdgeEnabled=true`; the window then reached 914.3 dp and the sheet
  rendered in full. This moved both platforms off Expo Go — see `README.md`.

- Observation: Android's navigation-bar contrast scrim paints over the bottom
  inset and erases whatever is drawn there, including the button's downward
  shadow, which is visible to the sides and above but not below. The bar lifts
  its content clear of the scrim on Android; the tail of the shadow is still
  trimmed, which was accepted as a matter of proportion.

- Observation: Android Studio ships JDK 25, and from JDK 24 a restricted call
  in `java.lang.System` breaks the Android Gradle Plugin's CMake configuration.
  `react-native-screens` and `react-native-worklets` both failed to configure.
  JVM flags did not help; JDK 17 — the version React Native 0.86 targets — did.
  Pinned in `~/.gradle/gradle.properties`, because `android/` is regenerated by
  `expo prebuild` and anything written there is discarded.

## Decision Log

- Decision: detail screens live in the **root stack**, not in a stack per tab.
  Rationale: `07` has no tab bar — the list detail is a full-screen push with a
  back link to the Przestrzeń and an input bar where the tab bar would be. The
  same holds for `10` and `17`. A stack per tab would also force a copy of
  `list/[id]` into both the feed tab and the Zakupy tab, since lists are
  reachable from both.
  Note: `docs/ROADMAP.md` describes M2 as "a stack per tab". That wording
  predates reading the mockups closely and should be corrected when this plan
  lands.
  Date/Author: 2026-08-19, planning.

- Decision: JS `Tabs` with a custom `tabBar`, not `unstable-native-tabs`.
  Rationale: the raised `+` in the middle is not a tab — it opens a sheet — and
  it overlaps the bar's top edge. A native tab bar cannot render it. The cost is
  that the bar is drawn by us rather than by the platform.
  Date/Author: 2026-08-19, planning.

- Decision: the raised `+` is a plain button inside our tab bar, not a fifth
  `Tabs.Screen` whose press is intercepted.
  Rationale: a tab screen cannot be a sheet — `presentation` and `sheet*` are
  native-stack options and do not exist in bottom-tabs options (verified in
  `expo-router/build/react-navigation/bottom-tabs/types.d.ts`, which offers only
  `tabBarButton`, `tabBarIcon`, `tabBarLabel`, `tabBarStyle`, `lazy`,
  `freezeOnBlur`). So the sheet is a root-stack route either way.
  The remaining choice was whether `+` occupies a real tab slot with its
  `tabPress` intercepted via `listeners` and `e.preventDefault()`. That works,
  but it requires a route file that exists only to hold a slot and never
  renders, and it saves no layout work because the bar is hand-drawn regardless.
  Give the button `accessibilityRole="button"` — it opens a sheet, it is not a
  tab.
  Date/Author: 2026-08-19, planning.

- Decision: route files are named in English, tab labels are Polish.
  Rationale: AGENTS.md constraint 3 — code is English, UI copy is Polish taken
  from the mockups. Route segments are code. So `lists.tsx` renders a tab
  labelled "Zakupy", and `profile.tsx` one labelled "Ty".
  Date/Author: 2026-08-19, planning.

- Decision: the tab bar is solid `colors.surface` with a hairline top border,
  no blur.
  Rationale: `13` and `35` show an opaque bar with a visible hairline and no
  content bleeding through. Blur would be a departure from the mockups, not a
  refinement of them.
  Date/Author: 2026-08-19, implementation.

- Decision: tab bar geometry lives in a `tabBar` block in `tokens.ts`
  (`height: 49`, `buttonSize: 52`, `buttonLift: 7`), measured from `13` at 2x.
  Rationale: AGENTS.md constraint 2 — a value missing from the tokens gets
  measured from the mockup and added there, never eyeballed into a component.
  Date/Author: 2026-08-19, implementation.

## Outcomes & Retrospective

All four steps are done. The app has its real shape: four tabs plus a raised
`+`, detail screens that push over the shell and hide the bar, and a sheet that
sizes itself to its content and dismisses by dragging. Verified in both themes
on the simulator; `npx tsc --noEmit` exits 0.

Measured against `13`: the raised button is 52.0 pt in both mockup and render,
and its vertical placement is within 1.5 pt.

Against the original purpose: M4 onward can fill screens in without deciding
navigation structure again.

The one structural change from the roadmap is recorded in the Decision Log —
detail screens live on the root stack, not in a stack per tab, because `07`
has no tab bar. `docs/ROADMAP.md` has been corrected.

The sheet was then rebuilt against `05` after the first version was written
from this plan's prose rather than from the mockup, and the raised button got
the drop shadow the mockups show. Chasing that sheet across platforms is what
moved the project off Expo Go onto development builds for both iOS and Android,
and pinned the Android toolchain to JDK 17.

What remains for M4: the detail screens keep the default native header, which
does not match `07`'s flat top. That is screen styling, not navigation.

Lesson: two of the three problems here came from comparing numbers across
different reference frames — a @2x mockup against a @3x screenshot, and an
acceptance criterion written from an assumption about how sheets stack rather
than from the mockup. Measuring is only useful once both sides are in the same
units.

## Context and Orientation

Read AGENTS.md at the root first. This plan builds on
`docs/exec-plans/active/20260819-1245-m1-ui-foundation.md` and
`docs/exec-plans/active/20260819-1322-m1b-motion-foundation.md`, both checked
in; they describe the primitives and the motion vocabulary this plan consumes
rather than re-creates.

Terms:

- **Przestrzeń** — the shared container for lists, notes and people. Polish
  domain term, stays Polish. See `docs/PROJECT.md`.
- **Route group** — a directory in parentheses, e.g. `(tabs)`, that organises
  files without adding a segment to the URL.
- **formSheet** — an iOS/Android presentation style where a screen slides up as
  a sheet over its parent, with native drag-to-dismiss.

What exists now:

    src/app/_layout.tsx      root Stack, loads Public Sans, sets StatusBar
    src/app/index.tsx        placeholder with a link to /gallery
    src/app/gallery.tsx      component gallery — keep it, it is the visual reference
    src/components/ui/       13 primitives; use them, do not write raw View/Text
    src/components/Icon.tsx  22 icons, English names
    src/hooks/               useTheme, useReducedMotion, usePressScale

Icons this milestone needs, all present: `home`, `basket`, `note`, `person`,
`plus`, `chevron-left`.

Mockups: `13` shows the tab bar most clearly — icons with labels underneath,
the active tab in the accent colour, the inactive ones muted, and the raised
accent circle overlapping the bar's top edge. `03`, `35` and `09` show the same
bar with a different tab active. `07` shows a pushed screen with no tab bar.
`05` shows the sheet the `+` opens.

No mockup listed under `docs/DESIGN.md` -> "Known mockup defects" is relied on.
This milestone touches nothing under `docs/PROJECT.md` ->
"Deliberately out of scope" — in particular, do not implement the "Udostępnij"
action visible in the `07` header.

## Plan of Work

Four steps. After step 1 the app is navigable; the rest refine it.

### Step 1 — Route tree and stubs

Create the `(tabs)` group with `_layout.tsx` using `Tabs`, and the four tab
screens. Each stub renders a `Screen` with a `Text` naming it, so a screenshot
shows which tab is active.

Move the current `index.tsx` placeholder content out of the way: the feed tab
becomes `(tabs)/index.tsx`. Keep a link to `/gallery` somewhere reachable —
`profile.tsx` is the natural home, since `13` is where app-level settings live.

At this point the default tab bar is fine; step 2 replaces it.

Acceptance: all four tabs reachable, `npx tsc --noEmit` exits 0.

### Step 2 — Custom tab bar

Add `src/components/TabBar.tsx` taking `BottomTabBarProps` and rendering five
slots: four tabs and the raised `+` between Zakupy and Notatki.

Details from `13`:
- icon above a small label, both accent when focused and muted when not,
- the `+` is a filled accent circle that overlaps the bar's top edge,
- the bar sits on the surface colour with a hairline top border.

Take every value from `useTheme()`. The circle's diameter and overlap are not
in the tokens — measure them from `13` and add them, or express them from the
spacing scale; do not hard-code numbers in the component.

Give the `+` press feedback with `usePressScale` so it matches every other
pressable. Tabs themselves get no scale animation — a tab bar that bounces on
each switch is noise.

Acceptance: the bar matches `13` in both themes.

### Step 3 — The sheet route

Create `new.tsx` rendering the "Co tworzymy" content from `05`: two rows,
"Lista zakupów" and "Notatka", each with its icon and a chevron. They navigate
nowhere yet.

Register it in the root `_layout.tsx`:

    <Stack.Screen
      name="new"
      options={{
        presentation: 'formSheet',
        sheetAllowedDetents: 'fitToContents',
        sheetGrabberVisible: true,
      }}
    />

Wire the `+` to `router.push('/new')`.

`sheetGrabberVisible` is iOS-only; Android will not draw the handle, which is
the intended platform difference — do not draw one by hand.

Acceptance: `+` opens the sheet, it sizes to its content, dragging down closes
it, and the tab bar stays visible behind the dimmed parent.

### Step 4 — Pushed detail screens

Create `list/[id].tsx` and `note/[id].tsx` as stubs that read their `id` and
render it, with a back link in the header styled like `07` ("‹ Mieszkanie 14").

Add a link from the Zakupy stub to `/list/1` and from the Notatki stub to
`/note/1` so the push is exercisable.

Confirm the tab bar is hidden on these screens — they are root-stack routes, so
it should be automatic. Confirm the open question about scroll position.

Acceptance: pushing and going back works from both tabs, no tab bar on the
detail screens.

## Concrete Steps

    npx tsc --noEmit
    # Expected: no output, exit code 0

This repo has no test suite and no configured linter, so the type checker is
the only automated gate. Everything else is verified by looking at the running
app. Do not invent test commands that do not exist.

Route types are generated by the dev server, so a new route will fail
type-checking until Metro has seen it. Start the server before trusting a
`Cannot find module` or an invalid-href error on a file you just created.

## Validation and Acceptance

    npx tsc --noEmit
    # Expected: no output, exit code 0

    npm start
    # Then press `i` to load the app in Expo Go.

Walk the whole shell: tap each of the four tabs, open the `+` sheet and dismiss
it by dragging, push into a list and a note and come back. Compare the tab bar
against `13` in **both light and dark themes** — the dark theme has its own
token values and is easy to break unnoticed.

Two standing rules while validating:
- **Do not start the iOS Simulator.** It must already be running; if no device
  is booted, say so and stop.
- Stop the Metro dev server when finished and leave port 8081 free.

Done means: every tab reachable, the sheet opens and dismisses, detail screens
push without the tab bar, and no component contains a hard-coded colour,
spacing value or font size.

## Idempotence and Recovery

Steps are additive. The one destructive edit is replacing the body of
`src/app/index.tsx`, whose current content is a placeholder with a link to
`/gallery`; the gallery route itself is untouched and remains the visual
reference.

If `formSheet` misbehaves, step 3 can be left with the sheet as an ordinary
pushed screen and revisited — steps 1, 2 and 4 do not depend on it.

## Artifacts and Notes

Files created:

    src/app/(tabs)/_layout.tsx
    src/app/(tabs)/index.tsx
    src/app/(tabs)/lists.tsx
    src/app/(tabs)/notes.tsx
    src/app/(tabs)/profile.tsx
    src/app/list/[id].tsx
    src/app/note/[id].tsx
    src/app/new.tsx
    src/components/TabBar.tsx

Files modified:

    src/app/_layout.tsx
    src/app/index.tsx        (removed — the feed tab replaces it)
    docs/ROADMAP.md          (correct the "stack per tab" wording)

Conventions from AGENTS.md: comments in English, UI copy Polish taken verbatim
from the mockups, Polish domain terms stay Polish, no hard-coded design values,
`reactCompiler` is on so do not hand-write `useMemo`/`useCallback`/`memo`, and
the repo owner commits.

## Interfaces and Dependencies

No new dependencies. `expo-router` 57.0.14 provides `Tabs` and the sheet
presentation through its vendored native-stack; `react-native-screens` 4.26.2
provides the sheet itself.

Depends on: M1's primitives and icons, M1b's motion tokens.

Depended on by: M4 (shopping lists) fills `(tabs)/lists.tsx` and
`list/[id].tsx`; M5 fills the note routes; M6 fills the feed; M7 fills
`profile.tsx` and adds the onboarding routes outside the tab shell.

This milestone must **not** add a data layer, real content, or any screen not
listed above. Stubs stay stubs.
