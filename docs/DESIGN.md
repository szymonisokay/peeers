# Design — źródła prawdy

## Makiety

`assets/design/*.png` — 42 ekrany, numeracja `01`–`42`. Brak `30` i `31` jest
celowy (były to warianty logotypu). Makiety są specyfikacją UI: jeśli kod
rozjeżdża się z makietą, domyślnie błąd jest w kodzie — z wyjątkiem usterek
wypisanych niżej.

Warianty ciemne: `38` (feed), `39` (lista), `40` (notatka).

## Tokeny

**`src/theme/tokens.ts` jest kanoniczne.** Nie wpisuj kolorów, odstępów ani
rozmiarów tekstu bezpośrednio w komponentach — bierz je z `useTheme()`.

Pochodzenie wartości:

- kolory jasnego motywu (`background`, `border`, `accent`, `text`) pochodzą ze
  specyfikacji podanej w oklch; hexy w pliku to jej dokładny odpowiednik sRGB,
- reszta (`textMuted`, `danger`, `success`, `warning*`, cały motyw ciemny)
  została **zmierzona z pikseli makiet**; przy każdym tokenie jest komentarz
  z numerem ekranu,
- semantyczne kolory motywu ciemnego (`danger`, `success`, `warning*`) to
  jedyne wartości wyprowadzone ręcznie — makiety ich nie pokazują.

Jeśli potrzebujesz koloru, którego nie ma w tokenach: zmierz go z makiety,
zamiast dobierać na oko, i dopisz do `tokens.ts` z adnotacją źródła.

Akcent różni się między motywami — `#505AC8` w jasnym, `#7787F3` w ciemnym.

## Typografia

Public Sans z `@expo-google-fonts/public-sans`, wagi 400/500/600/700, ładowane
w `src/app/_layout.tsx`. Skala w `typography` w `tokens.ts`.

Etykiety mają `letterSpacing: 0.88` — to `.08em` przeliczone na 11 px, bo
React Native nie przyjmuje jednostek względnych.

## Assety

| Katalog | Zawartość |
|---|---|
| `assets/icons/` | 16 ikon, 24×24, `stroke-width="1.9"`, `currentColor` |
| `assets/logo/` | znak w 3 wariantach |
| `assets/illustrations/` | ilustracje stanów pustych |

Nowe ikony trzymaj w tej samej konwencji: 24×24, `currentColor`, obrys 1.9,
zaokrąglone końce.

### Czego brakuje

Ikony używane na makietach, których nie ma w zestawie: `chevron-prawo`,
`chevron-lewo`, `plus`, `strzalka-w-gore`, `wiecej` (⋯), `strzalka-dol`.

Ilustracje: jest tylko `pusta-lista`. Bez grafik zostają: pusty feed świeżej
Przestrzeni, pusta lista notatek, brak wyników szukania, puste archiwum.

Ikona aplikacji i splash to nadal domyślne assety Expo — do podmiany na końcu.

Import `.svg` jako komponentów wymaga `react-native-svg-transformer` i wpisu
w `metro.config.js`. `react-native-svg` jest zainstalowane, transformer nie.

## Znane usterki makiet

Nie „naprawiaj" kodu, żeby się z nimi zgodzić.

| Ekrany | Rozbieżność |
|---|---|
| `03`, `07`, `20`, `27` vs `35`, `38` | „Biedronka, sobota" ma `2 z 8` albo `2 z 6` |
| `09` vs `10`, `40` | notatka „Kod do bramy i wifi": „widzą 3 osoby" vs „widoczne dla 2 osób" |
| `03` vs `35`, `38` | dopisanie 3 pozycji: raz Nina o 11:07, raz Kuba o 17:05 |
| `09` vs `14` | `09` pokazuje notatkę ukrytą przed Alą na liście widzianej jako Ala, a `14` mówi, że ukryta notatka nie pojawia się u tej osoby |
| `34` | wygasza zajęte kolory awatara — sprzeczne z decyzją o kolorach globalnych |
