# Peeers

Shared shopping lists and notes for people who live together.

A mobile app (iOS/Android) built with Expo SDK 57 and expo-router. No accounts
and no passwords — a person is a name and a color stored on the device.

## Getting started

```bash
npm install
```

```bash
npm start
```

Then press `i` (iOS) or `a` (Android). The app runs in Expo Go — no development
build required.

## Verification

```bash
npx tsc --noEmit
```

There are no tests and no configured linter yet. `npm run lint` will launch an
interactive ESLint wizard on first use.

## Layout

| Path | Contents |
|---|---|
| `src/app/` | expo-router routes (file-based routing) |
| `src/theme/` | design tokens — values only |
| `src/hooks/` | hooks, including `useTheme` |
| `src/components/` | icons, illustrations and the UI primitives |
| `assets/design/` | 42 PNG mockups — the UI spec |
| `assets/icons/`, `assets/logo/`, `assets/illustrations/` | source SVGs |
| `docs/` | project knowledge |

UI copy is Polish; everything else in this repo is written in English.
See [AGENTS.md](AGENTS.md).
