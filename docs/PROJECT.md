# Peeers — scope and vocabulary

## What this is

An app for people who share a flat: shopping lists and notes inside a shared
Przestrzeń. The priority is that adding something to a list takes seconds, and
that it stays visible who did what.

## Glossary

Polish domain terms are the product's vocabulary — the mockups and the UI use
exactly these words, so keep them in code and prose rather than translating.

| Term | Meaning |
|---|---|
| **Przestrzeń** | container for lists, notes and people. Type: Dom / Praca / Wyjazd. A person can belong to several. |
| **Lista** | a shopping list. Items have a name, a quantity and a note. Once everything is checked off, the list moves to the archive. |
| **Notatka** | free text inside a Przestrzeń. Can be hidden from selected people. |
| **Feed** | stream of events in a Przestrzeń ("Kuba odhaczył chleb i masło"). |
| **Rola** | `Członek` (adds, checks off, creates, invites) or `Admin` (everything a member does, plus Przestrzeń rules, deleting lists and changing roles). At least one admin must remain in a Przestrzeń. |
| **Kod zaproszenia** | 6-character code for joining a Przestrzeń, expires after 24 h. |

## Identity

No accounts, no passwords, no email. A person is a name plus an avatar color
stored on the device. Consequences worth keeping in mind while designing:

- no account recovery — a lost phone means losing access to the Przestrzeń,
- no second device for the same person,
- the name and color are **global** per person, not per Przestrzeń.

## MVP scope

In scope: onboarding (create a Przestrzeń or join with a code), the feed,
shopping lists with an archive, notes, people and roles, search, push
notifications, settings (appearance, privacy, profile), offline mode.

### Deliberately out of scope

These appear in the mockups but are **not being built now**. Do not add them on
your own initiative while working on something else.

| Item | Status |
|---|---|
| Feed posts with replies (visible on `03`) | after MVP, as messaging |
| Sharing a list via `peeers.app/l/…` link (`20`) | fully out; possibly a native share sheet later |
| Moving to a new phone | out |
| Presence — "Kuba jest w sklepie" (`23`) | out |
| Per-person access screen (`12` → "Dostęp do list i notatek") | out; the screens will be designed later |

Because link sharing is dropped, the "Udostępnij" action in the headers of
`07`, `15`, `27` and `28` has nothing to do — do not implement it.

### Simplifications accepted for the MVP

| Area | Decision |
|---|---|
| Notes | simplified markdown, **not** full rich text — even though mockups `10` and `40` show bold, a blockquote and inline chips |
| Sync | optimistic, with no conflict resolution |
| Avatar colors | global, and taken colors are **not** blocked — mockup `34` shows otherwise and is out of date on this point |

Known mockup defects: [DESIGN.md](DESIGN.md#known-mockup-defects).
