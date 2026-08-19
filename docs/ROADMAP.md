# Roadmap

The build order for Peeers, milestone by milestone. This is the umbrella
document that individual exec plans refer back to.

## How to use this

- Each milestone below becomes **one or more exec plans** under
  `docs/exec-plans/active/`, written with
  [exec-plans/create-plan-file.md](exec-plans/create-plan-file.md).
- A plan names the milestone it implements. This file does **not** link back to
  individual plans — it has to stay stable while plans come and go.
- Milestones are ordered by dependency, not by importance. Do not start one
  whose predecessors are unfinished without saying why.
- Scope boundaries live in [PROJECT.md](PROJECT.md); visual and token rules live
  in [DESIGN.md](DESIGN.md). This file adds sequence, nothing else.

## Where the project stands

Done: Expo 57 project, theme tokens for both schemes, Public Sans, the repo
harness, **M1** — the SVG pipeline, 22 icons and 13 primitives visible at
`/gallery` — and **M2**, the navigation shell: four tabs, the raised `+` with
its sheet, and pushed detail routes.

Next: M3. Everything from M3 down is unstarted.

## How the order was chosen

Three constraints shaped the sequence.

**The data layer has to anticipate sync before sync exists.** M3 builds local
storage while the app is still single-device, but it must already use
client-generated IDs and record changes as an append-only event log. If it does
not, M8 stops being an addition and becomes a rewrite of everything built in
M4–M7. This is the single most important ordering decision in this document.

**The core loop gets de-risked before the surrounding flows.** Lists are the
reason the app exists, so they come before onboarding, people and settings —
all of which are largely forms. A seeded Przestrzeń stands in for onboarding
until M7.

**Anything requiring a server waits for M8.** Joining by invite code, multi-user
sync and push notifications cannot work without a backend, so they sit behind
it. That is why invites (M9) come after the backend even though their screens
belong with the people screens.

## Milestones

| # | Milestone | Delivers | Depends on |
|---|---|---|---|
| M1 | UI foundation | icon pipeline, primitives matching the mockups | — |
| M2 | Navigation shell | tab bar and routes, screens as stubs — **done** | M1 |
| M3 | Data model and persistence | entities, local store, sync-ready event log | — |
| M4 | Shopping lists | the core loop, single device | M1–M3 |
| M5 | Notes | markdown notes | M1–M3 |
| M6 | Feed and Przestrzeń switching | activity stream, multi-Przestrzeń | M4, M5 |
| M7 | Onboarding and profile | first run, identity, appearance | M3, M6 |
| M8 | Backend and sync | the app becomes multi-person | M4–M7 |
| M9 | People, invites and roles | invite codes, roles, membership | M8 |
| M10 | Note visibility | per-person hiding | M9 |
| M11 | Search | across notes, items and archive | M4, M5 |
| M12 | Push notifications | batched notifications, quiet hours | M8, M9 |
| M13 | Privacy and data | privacy screen, export, local wipe | M7, M8 |
| M14 | Release assets | app icon, splash, store listing | everything |

### M1 — UI foundation

Install `react-native-svg-transformer`, wire it into `metro.config.js`, and add
an `Icon` component over `assets/icons/`. Draw the six missing icons listed in
[DESIGN.md](DESIGN.md#what-is-missing) in the existing convention.

Build the primitives the mockups repeat: text styles, screen scaffold, card,
list row, checkbox row, chip, button, bottom sheet, section label, empty state.

Replace the token preview in `src/app/index.tsx` with a component gallery so the
primitives can be checked against the mockups in both themes.

### M2 — Navigation shell

The five-slot tab bar — Przestrzeń, Zakupy, centre `+`, Notatki, Ty — with the
raised accent button. Every screen is a stub. The point is that navigation and
the bar's visual match land before any content does.

Detail screens live on the **root stack**, not in a stack per tab: `07` has no
tab bar, and lists are reachable from both the feed and the Zakupy tab, so a
per-tab stack would need two copies of the same route.

Bottom sheets are **routes**, not components: `presentation: 'formSheet'` with
`sheetAllowedDetents: 'fitToContents'`, which the vendored native-stack in
expo-router 57 supports on both platforms. This milestone establishes that
pattern; later milestones only add sheet routes. Note `sheetGrabberVisible` is
iOS-only, so Android will not show the grab handle drawn in the mockups.

### M3 — Data model and persistence

Entities: Przestrzeń, Osoba, Lista, Pozycja, Notatka, and a feed event. Local
persistence, a seeded Przestrzeń for development, and the read/write API the
feature milestones will use.

**Must be built sync-ready even though nothing syncs yet:** IDs generated on the
device, every mutation appended to an event log, timestamps and authorship on
each change. M6 reads the same log to render the feed, and M8 ships it to the
server.

Local storage is **`expo-sqlite`** accessed through **Drizzle ORM**, with
`useLiveQuery` as the reactive read primitive. The same event log lives locally
in SQLite and remotely in Postgres, with lists and notes materialised from it.
SQLite also carries the FTS5 index that M11 needs, so storage and search are one
decision, not two.

Drizzle earns its place by covering both ends of the sync: one typed schema
definition serves SQLite and the Supabase Postgres, and `drizzle-kit` handles
local schema migrations, which stop being optional the moment the app ships with
data on the device.

There is **no state manager for domain data** — see
[PROJECT.md](PROJECT.md#state-on-the-device). A single small Zustand store holds
runtime-only state (connection status, sync in flight); everything persistent is
read from the database. Do not add TanStack Query: screens never await the
network, because M8's sync loop writes into SQLite in the background.

Note that `reactCompiler` is enabled in `app.json`, so do not hand-write
`useMemo`/`useCallback`/`memo`, and do not pick libraries for re-render
performance.

Two things to check while writing this plan: how `drizzle-kit` migration files
are wired into Metro bundling (the likeliest source of friction in Expo Go), and
how `useLiveQuery` behaves under writes from several places at once. If the
Drizzle setup resists, the fallback is raw SQL over `expo-sqlite` plus a thin
hook on `addDatabaseChangeListener` — losing types and migrations, gaining zero
dependencies.

### M4 — Shopping lists

The core loop: list index with pinned/active/archive sections, list detail with
"do kupienia" and "odhaczone", quick-add with `x2`-as-quantity and
comma-as-note parsing, item detail sheet, paste-a-whole-list, frequent-item
suggestions, change history with restore, archive.

Mockups: `05`, `07`, `08`, `15`, `19`, `25`, `28`, `35`, `39`, `41`.

Soft delete from the start — `25` offers "Przywróć" for both checked-off and
deleted items.

### M5 — Notes

Note index and the note screen with a **simplified markdown** editor: bold,
italic, checklist, inline code chips, blockquote. Not full rich text — see
[PROJECT.md](PROJECT.md#simplifications-accepted-for-the-mvp).

Mockups: `09`, `10`, `40`.

### M6 — Feed and Przestrzeń switching

The activity stream rendered from the M3 event log, the two summary cards, and
the Przestrzeń switcher sheet with multiple Przestrzenie.

Mockups: `03`, `04`, `38`.

Note: `03` shows a feed post with a reply. That is messaging and is out of scope
— render events only.

### M7 — Onboarding and profile

Start screen, create-a-Przestrzeń (name and type), name-and-color profile, the
"Ty" tab, profile editing, appearance settings (theme, text scale, hide
checked-off, accent color).

Mockups: `01`, `13`, `17`, `22`, `32`, `33`.

The join-by-code path is **not** part of this milestone; it needs the server and
ships in M9. Text scaling from `22` has to reach the typography scale, so plan
for it rather than bolting it on.

### M8 — Backend and sync

The architectural milestone. Device identity without accounts, pushing the local
event log, pulling other people's events, and the offline UI: pending badges,
the "brak połączenia" banner, the pending-change counter.

Mockups: `27`.

Backend is **Supabase** — see [PROJECT.md](PROJECT.md#backend) for why. Concretely:
anonymous auth for device identity, the event log as one Postgres table
(`id, space_id, actor_id, type, payload, created_at`), push as `insert`, pull as
`select where created_at > cursor`, and a Realtime subscription for the live
feed. RLS isolates each Przestrzeń.

Optimistic, no conflict resolution — last write wins, per
[PROJECT.md](PROJECT.md#simplifications-accepted-for-the-mvp). Do not design a
merge UI.

Two things to check against current docs while writing this plan, rather than
from memory: the session storage adapter for the client in React Native
(AsyncStorage vs `expo-secure-store`, and whether a URL polyfill is still
needed), and how Realtime is enabled on RLS-protected tables. Expect the
membership RLS policy to need a `security definer` function to avoid recursion.

### M9 — People, invites and roles

Join by code, the people sheet, managing people, roles and the Przestrzeń rules,
removing a person, leaving, and the last-admin handover.

Mockups: `02`, `02b`, `06`, `11`, `12`, `21`, `24`, `34`, `36`, `37`.

Invite codes are generated and validated by an Edge Function and expire after
24 h — they must be unguessable, so this cannot move to the client.
Mockup `34` greys out taken avatar colors — do not implement that, colors are
global and unblocked.

### M10 — Note visibility

Per-person note hiding, from the note side.

Mockups: `14`.

The per-person pivot (`12` → "Dostęp do list i notatek") is out of scope; those
screens do not exist yet.

### M11 — Search

Pull-down search over notes, list items and the archive, with match
highlighting, recent searches and type filters. Runs locally against the SQLite
FTS5 index built in M3 — the server is not involved.

Mockups: `26`, `42`.

### M12 — Push notifications

Expo push tokens, batching into one bundle per Przestrzeń in an Edge Function
on a schedule, the notification settings screen, quiet hours, per-person muting.

Mockups: `16`, `18`.

The permission prompt has no mockup and has to be designed or specified.

### M13 — Privacy and data

Privacy screen, presence toggle wiring, export a copy of lists and notes, wipe
local data.

Mockups: `23`.

`23` offers a presence toggle, but presence itself is out of scope and no screen
shows how it renders. Either drop the toggle or get the screen designed first.

### M14 — Release assets

App icon and splash generated from `assets/logo/`, replacing the Expo defaults
in `app.json`. Store listing assets.

Mockups: `29`.

## Open questions

These block specific milestones and need answers before those plans can be
written.

| Question | Blocks | Notes |
|---|---|---|
| Push permission prompt | M12 | No mockup exists. |
| Illustrations for empty states | M4, M5, M11 | Only `empty-list` exists — see [DESIGN.md](DESIGN.md#what-is-missing). |

## Mockup coverage

All 41 mockups are accounted for.

| Milestone | Mockups |
|---|---|
| M1, M2, M3 | no screens of their own |
| M4 | `05` `07` `08` `15` `19` `25` `28` `35` `39` `41` |
| M5 | `09` `10` `40` |
| M6 | `03` `04` `38` |
| M7 | `01` `13` `17` `22` `32` `33` |
| M8 | `27` |
| M9 | `02` `02b` `06` `11` `12` `21` `24` `34` `36` `37` |
| M10 | `14` |
| M11 | `26` `42` |
| M12 | `16` `18` |
| M13 | `23` |
| M14 | `29` |
| out of scope | `20` |
