# Peeers

Wspólne listy zakupów i notatki dla osób, które mieszkają razem.

Aplikacja mobilna (iOS/Android) w Expo SDK 57 + expo-router. Bez kont i haseł —
tożsamość to imię i kolor trzymane na urządzeniu.

## Start

```bash
npm install
```

```bash
npm start
```

Potem `i` (iOS) lub `a` (Android). Aplikacja działa w Expo Go — nie wymaga
development buildu.

## Weryfikacja

```bash
npx tsc --noEmit
```

Nie ma jeszcze testów ani skonfigurowanego lintera. `npm run lint` uruchomi
interaktywny kreator ESLint przy pierwszym wywołaniu.

## Gdzie co jest

| Ścieżka | Zawartość |
|---|---|
| `src/app/` | trasy expo-router (file-based routing) |
| `src/theme/` | tokeny designu i hook `useTheme` |
| `assets/design/` | 42 makiety PNG — specyfikacja UI |
| `assets/icons/`, `assets/logo/`, `assets/illustrations/` | źródłowe SVG |
| `docs/` | wiedza projektowa |

Szczegóły: [AGENTS.md](AGENTS.md).
