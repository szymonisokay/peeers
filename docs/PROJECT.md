# Peeers — zakres i pojęcia

## Czym to jest

Aplikacja dla osób mieszkających razem: wspólne listy zakupów i notatki
w ramach Przestrzeni. Nacisk na to, żeby dopisanie rzeczy do listy zajmowało
sekundy i żeby było widać, kto co zrobił.

## Pojęcia

Nazewnictwo w kodzie i w UI trzymamy zgodne z tą listą — makiety używają
dokładnie tych słów.

| Pojęcie | Znaczenie |
|---|---|
| **Przestrzeń** | kontener na listy, notatki i osoby. Typ: Dom / Praca / Wyjazd. Osoba może należeć do kilku. |
| **Lista** | lista zakupów. Pozycje mają nazwę, ilość i dopisek. Po odhaczeniu wszystkiego schodzi do archiwum. |
| **Notatka** | tekst w Przestrzeni. Może być ukryta przed wybranymi osobami. |
| **Feed** | strumień zdarzeń w Przestrzeni („Kuba odhaczył chleb i masło"). |
| **Rola** | `Członek` (dodaje, odhacza, tworzy, zaprasza) albo `Admin` (to co członek + zasady Przestrzeni, usuwanie list, zmiana ról). W Przestrzeni musi zostać co najmniej jeden admin. |
| **Kod zaproszenia** | 6-znakowy kod do dołączenia do Przestrzeni, wygasa po 24 h. |

## Tożsamość

Bez kont, bez haseł, bez maila. Osoba to imię + kolor awatara trzymane na
urządzeniu. Konsekwencje, o których trzeba pamiętać przy projektowaniu:

- brak odzyskiwania dostępu — zgubiony telefon oznacza utratę Przestrzeni,
- brak drugiego urządzenia dla tej samej osoby,
- imię i kolor są **globalne** dla osoby, nie per Przestrzeń.

## Zakres MVP

W MVP wchodzi: onboarding (utworzenie Przestrzeni / dołączenie kodem), feed,
listy zakupów z archiwum, notatki, osoby i role, szukanie, powiadomienia push,
ustawienia (wygląd, prywatność, profil), tryb offline.

### Świadomie poza MVP

Te rzeczy są na makietach, ale **nie budujemy ich teraz**. Nie dodawaj ich
z własnej inicjatywy przy okazji innych zmian.

| Element | Status |
|---|---|
| Wpisy w feedzie z odpowiedziami (widoczne na `03`) | po MVP, jako wiadomości |
| Udostępnianie listy linkiem `peeers.app/l/…` (`20`) | poza MVP w całości; ewentualnie natywny share później |
| Przeniesienie na nowy telefon | poza MVP |
| Obecność „Kuba jest w sklepie" (`23`) | poza MVP |
| Ekran dostępu per osoba (`12` → „Dostęp do list i notatek") | poza MVP, widoki powstaną później |

Ponieważ udostępnianie odpada, akcja „Udostępnij" w nagłówkach `07`, `15`, `27`
i `28` nie ma celu — nie implementuj jej.

### Uproszczenia przyjęte na MVP

| Obszar | Decyzja |
|---|---|
| Notatki | uproszczony markdown, **nie** pełny rich text — mimo że makiety `10`/`40` pokazują pogrubienia, cytat i chipy |
| Synchronizacja | optymistyczna, bez rozwiązywania konfliktów |
| Kolory awatarów | globalne i **nie blokujemy** zajętych — makieta `34` pokazuje inaczej i jest w tym miejscu nieaktualna |

Znane błędy w makietach: [DESIGN.md](DESIGN.md#znane-usterki-makiet).
