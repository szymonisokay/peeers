# AGENTS.md

Peeers — wspólne listy zakupów i notatki dla osób mieszkających razem.
Expo SDK 57 + expo-router, TypeScript, iOS/Android.

Ten plik jest mapą. Wiedza szczegółowa siedzi w `docs/`.

## Od czego zacząć

| Zadanie | Czytaj najpierw |
|---|---|
| nowy ekran / zmiana UI | [docs/DESIGN.md](docs/DESIGN.md), makieta w `assets/design/` |
| pytanie „czy to jest w MVP" | [docs/PROJECT.md](docs/PROJECT.md) |
| nazewnictwo, role, uprawnienia | [docs/PROJECT.md](docs/PROJECT.md#pojęcia) |
| kolory, typografia, ikony | [docs/DESIGN.md](docs/DESIGN.md), `src/theme/tokens.ts` |
| planowanie większej zmiany | [docs/exec-plans/create-plan-file.md](docs/exec-plans/create-plan-file.md) |

Kod: `src/app/` to trasy (file-based routing), `src/theme/` to tokeny i motyw.

## Twarde ograniczenia

0. **Najpierw plan, potem kod.** Przed pracą przygotuj exec plan wg
   [docs/exec-plans/create-plan-file.md](docs/exec-plans/create-plan-file.md)
   i poczekaj na zatwierdzenie. Przy drobnej zmianie plan nie jest konieczny,
   ale zgoda właściciela repo tak. Czytanie plików i `tsc` są bezpieczne.
1. **Expo się zmieniło.** Przed pisaniem kodu sprawdź wersjonowaną
   dokumentację: https://docs.expo.dev/versions/v57.0.0/ — nie polegaj na
   pamięci ani na przykładach z wcześniejszych SDK.
2. **Nie wymyślaj wartości designu.** Kolory, odstępy i typografia pochodzą
   z `src/theme/tokens.ts`. Brakującą wartość zmierz z makiety i dopisz
   do tokenów z adnotacją źródła — nie dobieraj na oko i nie wpisuj na sztywno
   w komponencie.
3. **Teksty UI po polsku.** Makiety zawierają docelowe brzmienie — używaj go
   dosłownie zamiast tłumaczyć samodzielnie.
4. **Nie rozszerzaj zakresu MVP.** Lista rzeczy świadomie odłożonych jest
   w [docs/PROJECT.md](docs/PROJECT.md#świadomie-poza-mvp). Nie dokładaj ich
   przy okazji innych zmian.
5. **Makiety mają znane usterki.** Zanim dopasujesz kod do dziwnej makiety,
   sprawdź [listę rozbieżności](docs/DESIGN.md#znane-usterki-makiet).

## Weryfikacja

```bash
npx tsc --noEmit
```

Zmiany w UI sprawdzaj uruchomioną aplikacją na symulatorze, w obu motywach —
tryb ciemny ma osobne wartości tokenów i łatwo go zepsuć niezauważenie.

**Nie uruchamiaj symulatora.** Ma już działać, odpalony przez właściciela repo.
Jeśli żadne urządzenie nie jest zabootowane — powiedz o tym i nic nie startuj.

Nie ma testów ani skonfigurowanego lintera. `npm run lint` odpali interaktywny
kreator ESLint — nie uruchamiaj go mimochodem.

Dev server uruchamia właściciel repo. Jeśli startujesz go do własnej
weryfikacji, zatrzymaj go potem i zostaw wolny port 8081.

## Aktualizacja dokumentacji

Dokumentacja jest częścią zmiany, nie zadaniem na później. W tym samym commicie:

- zmieniasz zakres MVP, nazewnictwo, role albo model tożsamości
  → zaktualizuj [docs/PROJECT.md](docs/PROJECT.md),
- zmieniasz tokeny, typografię, zestaw ikon, albo znajdujesz kolejną
  rozbieżność w makietach → zaktualizuj [docs/DESIGN.md](docs/DESIGN.md),
- dodajesz lub zmieniasz skrypt npm albo sposób uruchamiania i weryfikacji
  → zaktualizuj `README.md`, sekcję „Weryfikacja" powyżej **oraz** sekcję
  „Project-Specific Conventions" w
  [docs/exec-plans/create-plan-file.md](docs/exec-plans/create-plan-file.md),
  która powtarza listę komend.

Kanoniczne dokumenty nie odwołują się do konkretnych planów — plany linkują
do dokumentów, nie odwrotnie.
