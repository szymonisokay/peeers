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
`/gallery` — **M2**, the navigation shell: four tabs, the raised `+` with its
sheet, and pushed detail routes — and **M3**, the data layer: SQLite through
Drizzle, an append-only event log, and a seeded "Mieszkanie 14" visible at
`/db`.

Also done: **M4b**, which interrupted M4 on purpose — the app had to speak two
languages before more copy was written, so the rest of M4 was authored bilingual
instead of extracted twice — and **M4**, the core loop: lists, quick-add, the
item sheet, creating and renaming, pasting a whole list, the change history and
the archive.

Next: M5, notes. Everything from M5 down is unstarted.

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
| M3 | Data model and persistence | entities, local store, sync-ready event log — **done** | — |
| M4 | Shopping lists | the core loop, single device — **done** | M1–M3 |
| M4b | Bilingual UI | Polish and English from message files — **done** | M4 (partly) |
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

Both of the questions this milestone opened are now answered, and the Drizzle
path held — the raw-SQL fallback was not needed.

Migration bundling works through two pieces of build configuration that did not
exist before: `babel.config.js` with `babel-plugin-inline-import` turns each
`.sql` file into a string at build time, and `metro.config.js` lists `sql` in
`sourceExts` so Metro hands those files to Babel at all. `drizzle-kit generate`
emits `src/db/migrations/migrations.js` only because `drizzle.config.ts` sets
`driver: 'expo'`.

`useLiveQuery` costs one render per *tick*, not per write: twenty writes in a
synchronous loop produced a single re-render, because expo-sqlite delivers its
change notifications asynchronously and React batches what follows. It also
refreshes only on changes to the table a query selects from, which is why every
function in `src/db/queries.ts` selects from exactly one table and screens join
in JavaScript.

### M4 — Shopping lists

The core loop: list index with pinned/active/archive sections, list detail with
"do kupienia" and "odhaczone", quick-add with `x2`-as-quantity and
comma-as-note parsing, item detail sheet, paste-a-whole-list, frequent-item
suggestions, change history with restore, archive.

Mockups: `05`, `07`, `08`, `15`, `19`, `25`, `28`, `35`, `39`, `41`.

Soft delete from the start — `25` offers "Przywróć" for both checked-off and
deleted items.

Two things this milestone settled that no mockup drew, both recorded in its exec
plan's Decision Log. The list detail header gets a "..." menu in the slot `07`
gives to "Udostępnij", which is not being built; and a list is named in a small
sheet before it exists, the same sheet doing the rename and `41`'s "Skopiuj
pozycje na nową listę".

**A list closes itself** once its last unchecked item is ticked, and reopens
when one is unticked — but only if it closed itself, because a list somebody hid
by hand stays hidden. That decision lives in the action layer, not the reducer:
`applyEvent` must stay true to M3's rule that applying an event never depends on
what this device already knows, so `checkItem` decides and appends a second
event. M8 pushes both in order and every phone replays the same two.

### M4b — Bilingual UI

Every user-visible string moves out of the components and into
`messages/pl.json` and `messages/en.json`, and the app picks a language from the
phone at startup — Polish for a phone that asks for Polish, English for
everything else. `src/i18n/` holds the setup; `i18next` with `react-i18next`
does the lookup, and `intl-pluralrules` supplies the `Intl.PluralRules` that
Hermes lacks and that Polish's three plural forms need.

**No in-app language switcher.** Changing the language belongs to M7's
appearance settings, next to the theme and the text scale, and `setLanguage` in
`src/i18n/index.ts` is the seam it plugs into.

This landed between M4.4 and M4.5 rather than at the end, because every
milestone after it writes new copy and the alternative was extracting it twice.

**The standing rule it leaves behind:** a new string is a new key in *both*
message files. `npx tsc --noEmit` enforces it — English types the keys, and an
assignment in `src/i18n/index.ts` fails when Polish is missing one. Polish is
verbatim from the mockups and is the reference for layout; English is authored.
See rule 3 in [AGENTS.md](../AGENTS.md).

Not translated, deliberately: `src/db/seed.ts`, whose data is the Przestrzeń the
mockups draw, and the two development routes `/gallery` and `/db`.

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
