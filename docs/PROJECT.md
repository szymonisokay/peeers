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

Technically a person is a Supabase **anonymous user**: the device holds a JWT
and a stable user id, and nothing else is ever asked for. The name and color are
profile data attached to that id.

## Backend

**Supabase.** Postgres, Realtime, row-level security and Edge Functions. Chosen
because it matches this product's shape rather than the other way around:

- anonymous auth maps directly onto device-bound identity with no accounts,
- the client is plain JS over HTTP and WebSocket, so the app keeps running in
  Expo Go with no development build,
- the sync unit is an append-only event log, which is one Postgres table plus a
  Realtime subscription,
- RLS isolates each Przestrzeń in the database, which matters when there are no
  accounts and a leaked identifier must not grant access.

Only two things are genuinely server-side, and both are Edge Functions:
generating and validating invite codes, and batching push notifications into one
bundle per Przestrzeń.

Migrations and functions live in `supabase/` in this repo.

### State on the device

SQLite **is** the application state — there is no separate store for domain
data. Lists, items, notes and the event log live in the database and survive a
restart. Screens subscribe to queries through Drizzle's `useLiveQuery`, so a
local write and an incoming Realtime event both refresh the UI by the same path,
with no manual invalidation.

The boundary to hold: **anything that must survive a restart or appear on
another phone goes into SQLite.** Only what dies with the process — connection
status, whether a sync is in flight — belongs in the small Zustand store. Domain
data in that store is the failure this design exists to avoid.

That store does not exist yet and arrives with M8. Both pieces of state it is
meant to hold are created by the sync loop, so M3 shipped the database without
it rather than adding an empty store — which also means there is currently
nowhere to put domain data by mistake.

Two operational consequences to plan for: anonymous users accumulate and need a
cleanup policy, and an RLS policy of the form "I am a member of this Przestrzeń"
recurses if `space_members` is guarded by the same rule — use a
`security definer` function to check membership.

If hand-written sync becomes painful, a sync engine such as PowerSync can be
added on top of the same Postgres without changing the database.

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
