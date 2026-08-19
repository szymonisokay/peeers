# Add motion to the UI primitives

**IMPLEMENTER INSTRUCTION: Keep this plan up to date as you work.**
After each significant step, update the `Progress` section with what was done and what's next. If context is lost or you are interrupted, the plan must contain everything needed to resume. Treat the plan as the single source of truth for this work.

This ExecPlan is a living document. The sections `Progress`, `Surprises &
Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept
up to date as work proceeds.

Reference: This plan follows conventions from AGENTS.md (root),
docs/PROJECT.md, docs/DESIGN.md, and docs/exec-plans/create-plan-file.md.
It extends milestone M1 from docs/ROADMAP.md with a motion layer.

## Purpose / Big Picture

The primitives from M1 are correct but static. Checking an item off a list
snaps: the circle fills instantly, the row jumps into the "odhaczone" section,
the counter changes with no connection between cause and effect. The app reads
as a form, not as something responsive.

After this change the most repeated interaction in the product — ticking
something off a shopping list — animates: the checkbox springs, the row slides
into its new position, and the progress bar grows to match. Pressing anything
gives a small physical response. Nothing else moves.

You can see it by opening `/gallery`, tapping the checkbox row and watching the
row travel rather than teleport.

## Bird's Eye View

    BEFORE                              AFTER

    tap checkbox                        tap checkbox
      |                                   |
      v                                   v
    state flips                         state flips
      |                                   |
      v                                   v
    row re-renders in new place         checkbox springs (scale + fill)
    progress bar jumps                  row animates to its new position
    counter text changes                progress bar grows to the new width
                                        counter text changes

    (no intermediate frames)            (~200 ms, skipped entirely when the
                                         OS "Reduce Motion" setting is on)

Where motion is added and where it deliberately is not:

| ADDED | UNCHANGED | REMOVED |
|---|---|---|
| `CheckboxRow` tick + spring | `Toggle` (platform Switch already animates) | flat `opacity` press feedback |
| list reorder / add / remove | sheets (native `formSheet` animates) | — |
| `Button`, `Chip`, `ListRow` press scale | screen transitions (the navigator's job, M2) | — |
| `ProgressBar` width | `Card`, `Avatar`, `SectionLabel` — no state to animate | — |
| `SegmentedControl` selected pill | | |
| `EmptyState` fade-in | | |

Token flow, mirroring how colour already works:

    tokens.ts (motion: durations, spring, easing)
        |
        +--> useTheme().motion --> primitive --> Reanimated worklet
        |
        +--> useReducedMotion() --> duration 0 when the OS asks for it

## Assumptions

- `react-native-reanimated` 4.5.1 works in Expo Go with no extra setup:
  `babel-preset-expo` 57.0.7 already wires `react-native-worklets/plugin`.
  Verified by inspecting the preset build; **confirm at runtime in step 1**.
- Reanimated's layout animations (`LinearTransition`, `FadeIn`, `FadeOut`) are
  available in 4.5.1. Verified against the installed type definitions.
- The React Compiler, enabled in `app.json`, does not interfere with worklets.
  **Verify in step 1**; if it does, record the workaround in the Decision Log.

## Open Questions

- Should the feed (M6) stagger its rows on first paint? Not decided here —
  this plan deliberately covers only primitives, and a stagger is a screen-level
  choice. Impacts M6, not this plan.

## Progress

- [ ] Step 1 — motion tokens, reduced-motion hook, runtime smoke check
- [ ] Step 2 — press feedback on `Button`, `Chip`, `ListRow`, `CheckboxRow`
- [ ] Step 3 — `CheckboxRow` tick, list reorder, `ProgressBar`
- [ ] Step 4 — `SegmentedControl` pill, `EmptyState` fade-in
- [ ] Step 5 — gallery section demonstrating each, checked in both themes

## Surprises & Discoveries

- (nothing yet)

## Decision Log

- Decision: motion values live in `src/theme/tokens.ts` as a `motion` block, not
  inline in components.
  Rationale: AGENTS.md constraint 2 forbids inventing design values in
  components. Durations and spring parameters are design values like any colour,
  and having them in one place is what stops eight components from each picking
  their own "roughly 200 ms".
  Date/Author: 2026-08-19, planning.

- Decision: animate only state changes the user caused, never decoration.
  Rationale: the mockups describe a calm utility app. Animating cards, labels or
  screen entry makes a shopping list feel slower on the tenth use, not livelier.
  The test for adding motion is "does this connect a cause to its effect?"
  Date/Author: 2026-08-19, planning.

- Decision (placeholder): whether the React Compiler needs any accommodation for
  worklets. To be recorded in step 1.

## Outcomes & Retrospective

- (to be filled at completion)

## Context and Orientation

Read AGENTS.md at the root first. This plan builds directly on
`docs/exec-plans/active/20260819-1245-m1-ui-foundation.md`, which is checked in
and should be read for what the primitives are; it is not repeated here.

Terms:

- **Worklet** — a JavaScript function Reanimated runs on the UI thread rather
  than the JS thread, so an animation keeps running even when JS is busy. The
  babel plugin rewrites them; no manual annotation is needed for the APIs used
  here.
- **Layout animation** — Reanimated animating a component into, out of, or
  between positions automatically when the tree changes, without the component
  computing coordinates itself.
- **Reduce Motion** — an OS accessibility setting. When on, animation must not
  merely be shorter, it must not play.

Files affected: `src/theme/tokens.ts`, `src/theme/index.ts`,
`src/components/ui/{Button,Chip,ListRow,CheckboxRow,ProgressBar,SegmentedControl,EmptyState}.tsx`,
`src/app/gallery.tsx`. One new file, `src/theme/useReducedMotion.ts`.

Mockups: `07` and `39` for the checked/unchecked row, `35` for the progress bar,
`11` for the segmented control, `15` for the empty state. The mockups are static
images and specify no timings — the values below are a motion vocabulary being
introduced, and they are the one place in this plan where numbers are chosen
rather than measured. They are deliberately conservative.

This touches nothing under `docs/PROJECT.md` -> "Deliberately out of scope".

## Plan of Work

### Step 1 — Motion tokens and the reduced-motion hook

Add to `src/theme/tokens.ts`:

    export const motion = {
      duration: { instant: 0, fast: 120, base: 200, slow: 320 },
      spring: { damping: 18, stiffness: 220, mass: 0.6 },
      pressScale: 0.97,
    } as const;

Export it from `useTheme()` alongside `colors` and `spacing`.

Add `src/theme/useReducedMotion.ts` wrapping
`AccessibilityInfo.isReduceMotionEnabled()` and its change event, returning a
boolean. Every animated primitive reads it and falls back to `duration.instant`
plus no layout animation.

Smoke-check that Reanimated runs in Expo Go before building on it: animate one
value in the gallery, confirm it moves, and confirm no worklet error appears in
the Metro log. Record the React Compiler finding in the Decision Log.

### Step 2 — Press feedback

Replace the `opacity` change in `Button`, `Chip`, `ListRow` and `CheckboxRow`
with a spring scale to `motion.pressScale` on press-in and back on press-out,
using `Animated.View` and `useSharedValue`. Keep a small opacity change on
`plain` buttons, where scaling bare text looks wrong.

### Step 3 — The core interaction

`CheckboxRow`: on toggle, spring the circle's fill and scale the tick in from
`0.6`. Fade the title to muted and animate the strikethrough in rather than
snapping it.

List reordering: wrap list children in `Animated.View` with
`LinearTransition.duration(motion.duration.base)`, plus `FadeIn`/`FadeOut` for
items added and removed. This is what makes a checked item travel to the
"odhaczone" section instead of teleporting.

`ProgressBar`: drive width with `withTiming` on `motion.duration.base` so it
grows to the new value.

### Step 4 — Secondary motion

`SegmentedControl`: slide the selected pill between options instead of
re-painting it, using a shared value for the offset.

`EmptyState`: `FadeIn` on mount, `motion.duration.slow`. This is the one place a
purely decorative animation is justified, because an empty screen appearing
instantly reads as a loading failure.

### Step 5 — Gallery

Add a section to `/gallery` with a checkbox list long enough to show reordering,
a progress bar wired to the same state, and buttons to add and remove an item.

## Concrete Steps

    npx tsc --noEmit
    # Expected: no output, exit code 0

This repo has no test suite and no configured linter, so the type checker is
the only automated gate. Everything else is verified by looking at the running
app. Do not invent test commands that do not exist.

## Validation and Acceptance

    npx tsc --noEmit
    # Expected: no output, exit code 0

    npm start
    # Then press `i` to load the app in Expo Go.

On `/gallery`: tick an item and watch it travel to the checked group while the
progress bar grows; press each button and chip and feel the scale; switch
segments and watch the pill slide. Check in **both light and dark themes**.

Then enable Reduce Motion on the simulator
(Settings -> Accessibility -> Motion -> Reduce Motion) and repeat: every
interaction must still work and still change state, with no animation playing.

Two standing rules while validating:
- **Do not start the iOS Simulator.** It must already be running; if no device
  is booted, say so and stop.
- Stop the Metro dev server when finished and leave port 8081 free.

Done means: the interactions above animate, nothing else in the app moves, and
Reduce Motion disables all of it.

## Idempotence and Recovery

Every step is additive and independently revertible — each primitive keeps its
current behaviour until its own step lands. If Reanimated turns out not to work
in Expo Go, stop after step 1 and report; the fallback would be React Native's
`Animated` API, which cannot do layout animations and would make step 3 much
weaker, so it is a decision to bring back rather than take unilaterally.

## Artifacts and Notes

Conventions that apply, from AGENTS.md: comments in English, UI copy in Polish
from the mockups, no hard-coded design values, `reactCompiler` is on so do not
hand-write `useMemo`/`useCallback`/`memo`, and the repo owner commits.

## Interfaces and Dependencies

No new dependencies. `react-native-reanimated` 4.5.1 and
`react-native-worklets` 0.10.1 are already installed and wired through
`babel-preset-expo`.

Depends on: M1's primitives and the theme tokens.

Depended on by: every later milestone inherits this motion vocabulary. M2 should
not re-invent press feedback for the tab bar; it should use `motion` from the
tokens.

This plan must **not** add screen transitions, sheet animation, gesture-driven
interactions, or any feature screen.
