# AGENTS.md

Peeers — shared shopping lists and notes for people who live together.
Expo SDK 57 with expo-router, TypeScript, iOS/Android.

This file is a map. The detail lives in `docs/`.

## Where to start

| Task | Read first |
|---|---|
| new screen or UI change | [docs/DESIGN.md](docs/DESIGN.md), the mockup in `assets/design/` |
| "is this in the MVP?" | [docs/PROJECT.md](docs/PROJECT.md) |
| "what comes next?" | [docs/ROADMAP.md](docs/ROADMAP.md) |
| naming, roles, permissions | [docs/PROJECT.md](docs/PROJECT.md#glossary) |
| colors, typography, icons | [docs/DESIGN.md](docs/DESIGN.md), `src/theme/tokens.ts` |
| planning a larger change | [docs/ROADMAP.md](docs/ROADMAP.md), then [docs/exec-plans/create-plan-file.md](docs/exec-plans/create-plan-file.md) |

Code layout:

| Path | Holds |
|---|---|
| `src/app/` | routes (file-based routing) |
| `src/theme/` | design tokens — values only, no React |
| `src/hooks/` | every hook, including `useTheme` |
| `src/components/` | `Icon`, `Illustration`, and the primitives under `ui/` |
| `src/db/` | the data layer: schema, event log, actions and queries |
| `src/lib/` | pure helpers — Polish grammar, dates, parsing. No React, no database |

## Hard constraints

0. **Plan first, then code. The repo owner commits.** Before starting work,
   write an exec plan following
   [docs/exec-plans/create-plan-file.md](docs/exec-plans/create-plan-file.md)
   and wait for approval. A small change does not need a plan, but it still
   needs the owner's approval. Leave changes in the working tree — never run
   `git commit`, `git add` or `git push`, and do not create branches or PRs.
   At the end of the work you may **propose** a commit message as text.
   Reading files, `tsc`, and `git status`/`diff`/`log` are safe.
1. **Expo has changed.** Check the versioned documentation before writing any
   code: https://docs.expo.dev/versions/v57.0.0/ — do not rely on memory or on
   examples from earlier SDKs.
2. **Do not invent design values.** Colors, spacing and typography come from
   `src/theme/tokens.ts`. Measure a missing value from the mockup and add it to
   the tokens with a source annotation — never eyeball it, and never hard-code
   it in a component.
3. **Language split.** Documentation (`AGENTS.md`, `README.md`, everything in
   `docs/`), code, and code comments are written in **English**. UI copy is
   **Polish** and is taken verbatim from the mockups, never translated by hand.
   Polish domain terms (Przestrzeń, Lista, Notatka, Członek, Admin) stay Polish
   in prose too — they are the product's vocabulary, not text to localize.
4. **Do not widen the MVP.** The list of deliberately deferred work is in
   [docs/PROJECT.md](docs/PROJECT.md#deliberately-out-of-scope). Do not add any
   of it while doing something else.
5. **The mockups have known defects.** Before matching code to an odd mockup,
   check the [list of discrepancies](docs/DESIGN.md#known-mockup-defects).

## Verification

```bash
npx tsc --noEmit
```

After changing `src/db/schema.ts`, regenerate the migration — the app applies it
at startup, so a schema edit without this does nothing:

```bash
npm run db:generate
```

**Both platforms run from a development build**, not Expo Go — `formSheet`
collapses to zero height in Expo Go on Android. The bundler is `npm run dev`;
`npm run android` and `npm run ios` rebuild a platform and are needed only when
native code or config changes. Android builds require **JDK 17**, pinned in
`~/.gradle/gradle.properties`; Android Studio's bundled JDK 25 breaks the CMake
configuration of the native modules. See `README.md`.

Check UI changes against the running app in **both themes** — the dark theme
has its own token values and is easy to break unnoticed.

**Do not start the iOS Simulator or the Android emulator.** Both are expected
to be running already, launched by the repo owner. If no device is booted, say
so and start nothing — no `Simulator.app`, no `emulator -avd`, no `simctl boot`.
Driving a device that is already up is verification, not launching, and is fine:
`simctl io`/`ui`/`openurl` on iOS, `adb screencap`/`input`/`shell` on Android.

There are no tests and no configured linter. `npm run lint` launches an
interactive ESLint wizard — do not run it casually.

The repo owner runs the dev server. If you start it for your own verification,
stop it afterwards and leave port 8081 free.

## Keeping docs current

Documentation is part of the change, not a follow-up. In the same commit:

- changing MVP scope, naming, roles or the identity model
  → update [docs/PROJECT.md](docs/PROJECT.md),
- finishing a milestone, resequencing, or answering one of its open questions
  → update [docs/ROADMAP.md](docs/ROADMAP.md),
- changing tokens, typography, the icon set, or finding another mockup
  discrepancy → update [docs/DESIGN.md](docs/DESIGN.md),
- adding or changing an npm script or the way the app is run and verified
  → update `README.md`, the "Verification" section above, **and** the
  "Project-Specific Conventions" section in
  [docs/exec-plans/create-plan-file.md](docs/exec-plans/create-plan-file.md),
  which repeats the command list.

Canonical docs never reference individual exec plans — plans link to docs, not
the other way around.
