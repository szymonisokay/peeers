# M3 — Data model and persistence: SQLite, an event log, and a seeded Przestrzeń

**IMPLEMENTER INSTRUCTION: Keep this plan up to date as you work.**
After each significant step, update the `Progress` section with what was done
and what's next. If context is lost or you are interrupted, the plan must
contain everything needed to resume. Treat the plan as the single source of
truth for this work.

This ExecPlan is a living document. The sections `Progress`, `Surprises &
Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to
date as work proceeds.

Reference: This plan follows conventions from `AGENTS.md` (root),
`docs/PROJECT.md`, `docs/DESIGN.md`, and `docs/exec-plans/create-plan-file.md`.
It implements milestone **M3** from `docs/ROADMAP.md`.

A note on the code samples below: they are indented with spaces so that markdown
renders them as code blocks. The repository itself is written with **tab
indentation and no semicolons** — match `src/theme/tokens.ts`,
`src/app/_layout.tsx` and `src/app/new.tsx`, not the older 2-space files such as
`src/app/gallery.tsx`.


## Purpose / Big Picture

Right now every screen in this app is a stub with hard-coded arrays in it. Open
`src/app/(tabs)/lists.tsx` and you will find three lines of placeholder text.
Nothing the user does survives a reload, because nothing is stored anywhere.

After this change the app has a real database on the phone. There is a
Przestrzeń called "Mieszkanie 14" with three people in it, one shopping list
with eight items (two of them checked off) and four notes — the exact contents
of mockups `03`, `07` and `09`. You can check an item off, force-quit the app,
reopen it, and the item is still checked. Every one of those changes is also
recorded as a row in an append-only **event log**: a table that never has rows
updated or deleted, only added, where each row says who did what and when.

That event log is the whole point of doing this now rather than later. In M8
this app grows a server and two phones start sharing a Przestrzeń. When that
happens, the code that applies a change must not care whether the change came
from a tap on this phone or from a message off the network — it must be the same
function either way. If M3 stores lists and notes as plain rows that screens
mutate directly, M8 stops being an addition and becomes a rewrite of everything
M4 through M7 built on top. So M3 builds the pipe in the shape M8 needs, and
runs only local traffic through it for now.

**How you will see it working.** After implementing this plan, run the app and
go to the "Ty" tab, then tap the new "Database check" link. You will see the
seeded Przestrzeń, the list "Biedronka, sobota" with the counter "2 z 8", the
eight items, and the most recent events. Tap the circle next to "Mleko owsiane".
The counter changes to "3 z 8" immediately, with no refresh button and no
navigation, and a new `item.checked` row appears at the top of the event list.
Force-quit the app from the app switcher, reopen it, return to that screen: the
item is still checked and the event is still there.


## Bird's Eye View

### Before

    ┌─────────────────────────────────────────────────────┐
    │ src/app/(tabs)/lists.tsx   src/app/gallery.tsx      │
    │                                                     │
    │   const INITIAL_ITEMS = [ ... ]   ← hard-coded      │
    │   useState(...)                   ← dies on reload  │
    └─────────────────────────────────────────────────────┘

    Nothing is stored. Nothing is shared. Nothing is recorded.

### After

    ┌──────────────────────────────────────────────────────────────┐
    │  Screens (src/app/**)                                        │
    │                                                              │
    │    read  ──►  useLiveQuery(queries.itemsInList(id))          │
    │    write ──►  actions.checkItem(itemId)                      │
    └───────────────┬───────────────────────────┬──────────────────┘
                    │                           │
                    │ (read)                    │ (write)
                    │                           ▼
                    │            ┌───────────────────────────────┐
                    │            │ src/db/actions.ts             │
                    │            │  builds one AppEvent:         │
                    │            │  { id, spaceId, actorId,      │
                    │            │    type, payload, createdAt } │
                    │            └───────────────┬───────────────┘
                    │                            │
                    │                            ▼
                    │            ┌───────────────────────────────┐
                    │            │ src/db/apply.ts               │
                    │            │  applyEvent(event)            │
                    │            │  ── ONE transaction ──        │
                    │            │  1. INSERT INTO events        │
                    │            │  2. materialise(event)        │
                    │            └───────────────┬───────────────┘
                    │                            │
                    ▼                            ▼
    ┌──────────────────────────────────────────────────────────────┐
    │  SQLite  (expo-sqlite, file peeers.db, via Drizzle ORM)      │
    │                                                              │
    │   events        ← append-only. Never UPDATE, never DELETE.   │
    │   ─────────────────────────────────────────────────────────  │
    │   spaces  people  space_members  lists  list_items  notes    │
    │   settings                                                   │
    │                  ↑ derived from the log, cheap to read       │
    └──────────────────────────────────────────────────────────────┘
                    │
                    │ expo-sqlite change listener
                    ▼
        useLiveQuery re-runs affected queries → screens re-render

### What M8 adds later (not built here — shown so the shape is visible)

                       ┌──────────────────────────┐
      remote events ──►│ src/db/apply.ts          │──► same tables
      (Supabase pull)  │ applyEvent(event)        │
                       └──────────────────────────┘
                                  ▲
      local events ───────────────┘  ── one reducer, two callers

    Push is `SELECT * FROM events WHERE synced_at IS NULL`.
    That is the entire reason the log exists now.

### Key changes

    REMOVED          nothing — no existing file loses behaviour
    ADDED            src/db/            the whole data layer
                     src/db/migrations/ generated SQL migrations
                     src/hooks/useDatabase.ts
                     src/app/db.tsx     development-only check screen
                     babel.config.js    (did not exist before)
                     drizzle.config.ts
                     4 npm dependencies, 2 dev dependencies
    CHANGED          metro.config.js    one line: .sql in sourceExts
                     src/app/_layout.tsx  gate render on migrations
                     src/app/(tabs)/profile.tsx  a link to /db
                     package.json       one script: db:generate
    UNCHANGED        src/theme/**       no token changes at all
                     src/components/**  no primitive changes at all
                     every existing screen's appearance

### Data flow, traced end to end

    User taps the circle next to "Mleko owsiane" on /db
      │
      ├─ 1. onPress → actions.checkItem({ itemId, spaceId })
      │
      ├─ 2. actions builds an AppEvent:
      │       id:        randomUUID()            ← device-generated, never the DB
      │       spaceId:   "…"                     ← which Przestrzeń
      │       actorId:   currentPersonId()       ← from the settings table
      │       type:      "item.checked"
      │       payload:   { itemId: "…" }
      │       createdAt: "2026-08-19T16:41:00.000Z"   ← ISO-8601 UTC
      │
      ├─ 3. applyEvent(event) opens ONE SQLite transaction:
      │       INSERT INTO events (…)                      ← the record
      │       UPDATE list_items SET checked_at = …,       ← the effect
      │              checked_by = … WHERE id = …
      │       COMMIT
      │
      ├─ 4. expo-sqlite fires its change listener for `list_items`
      │
      ├─ 5. useLiveQuery sees the table it selected from changed
      │       and re-runs the query
      │
      └─ 6. React re-renders: "2 z 8" becomes "3 z 8", the row moves
            into the ODHACZONE section

    Later, in M8, step 3's INSERT is what gets pushed to Postgres, and an
    identical applyEvent() call is what happens when someone else's event
    arrives. Nothing in steps 1–2 or 4–6 changes.


## Assumptions

These are working assumptions that unblock planning. Each must be confirmed and
moved into the Decision Log, or removed, before this plan is closed.

**A1. Drizzle ORM works on Expo SDK 57 without patching.** The `drizzle-orm`
package declares `expo-sqlite: >=14.0.0` as a peer dependency; this project has
`expo-sqlite@~57.0.1`, which satisfies that range, but SDK 57 renumbered the
package from `15.x` to `57.x` and no compatibility statement exists for the pair.
Milestone 1 exists to retire this risk before anything else is built on it. The
fallback is written out in full under "Idempotence and Recovery".

**A2. Creating `babel.config.js` does not break Reanimated or the React
Compiler.** This project has never had a Babel config file; adding one is a real
risk because two features currently work through automatic configuration.
Verified by reading the installed preset:
`node_modules/babel-preset-expo/build/configs/expo.js:107-117` adds the
`react-native-worklets/plugin` itself whenever the package resolves, and
`node_modules/babel-preset-expo/build/index.js:24` reads the React Compiler flag
from the Babel *caller* (Metro), not from the config file. So a config that
lists `presets: ['babel-preset-expo']` keeps both. Milestone 1 confirms this by
observation, not by reading alone: a press animation must still scale, and the
app must still build with `reactCompiler: true` in `app.json`.

**A3. The device owner is "Ala".** Mockups `03`, `07` and `09` show three people
— Ala (blue), Kuba (green), Nina (orange) — and render the local person as "Ty"
with a blue "A" avatar. The seed therefore creates Ala as the local person. M7
replaces the seed with real onboarding.

**A4. Seed data is development-only.** `docs/ROADMAP.md` calls for "a seeded
Przestrzeń for development". The seed runs only when `__DEV__` is true. A
release build starts with an empty database, which is correct: M7 owns first-run.

**A5. Note visibility is not modelled here.** Mockup `09` shows "Pomysły na
urodziny Ali" as "Ukryte dla Ali". Per-person note hiding is **M10**
(`docs/ROADMAP.md`). The seed creates that note with no visibility data and it
is visible to everyone. Do not add a visibility table or column — that would
widen the MVP milestone boundary.

**A6. Full-text search is not built here.** `docs/ROADMAP.md` notes that SQLite
also carries the FTS5 index M11 needs. M3 chooses SQLite partly for that reason
but builds no index and adds no `expo-sqlite` config plugin. M11 does that work.


## Open Questions

None. All three questions this plan opened were answered by the repo owner on
2026-08-19 and are recorded in the Decision Log below: the migration-failure
screen stays blank, Zustand waits for M8, and the event union carries the eight
types M3 implements. Raise new questions here as implementation uncovers them,
tagged with the section they affect.


## Progress

- [x] (2026-08-19 16:46Z) Plan written and approved. All three open questions
      answered by the repo owner; answers moved into the Decision Log.
- [x] (2026-08-19 17:40Z) Milestone 1 — the database boots (dependencies, bundling, migrations).
      Done: `expo-sqlite@57.0.1`, `expo-crypto@57.0.1`, `drizzle-orm@0.45.2`,
      `drizzle-kit@0.31.10` and `babel-plugin-inline-import@3.0.0` installed;
      `babel.config.js` created; `.sql` added to Metro's `sourceExts`;
      `drizzle.config.ts`, `src/db/schema.ts` (settings only) and
      `src/db/client.ts` written; `npm run db:generate` produced
      `0000_gifted_doctor_octopus.sql` plus `migrations.js`;
      `src/hooks/useDatabase.ts` gates the root layout; `/db` check screen
      created and linked from the "Ty" tab; `npx tsc --noEmit` exit 0.
      Verified on iOS (iPhone 17, iOS 26): `/db` shows `migrations: ok`,
      "Write timestamp" writes a row, `useLiveQuery` refreshes the count and the
      value with no navigation, and after a force-quit the same timestamp
      `2026-08-19T17:25:19.107Z` is still on screen — read from disk.
      Verified on Android (emulator-5554, Android 13) after a rebuild:
      `migrations: ok`, the write lands, the live query refreshes, and after
      `am force-stop` the same timestamp `2026-08-19T17:39:54.110Z` is back on
      screen. Both platforms pass; the Drizzle path holds and the raw-SQL
      fallback is not needed.
- [x] (2026-08-19 20:20Z) Milestone 2 — schema, event log, reducer and actions.
      Eight tables, `0001_dashing_shocker.sql`, `applyEvent` as the only writer,
      ten actions. The exhaustiveness guard was tested rather than assumed: a
      ninth event type with no reducer branch fails `tsc` (evidence below).
- [x] (2026-08-19 20:30Z) Milestone 3 — the development seed reproducing `03`,
      `07` and `09`. Exactly 20 events on a fresh seed, as predicted.
- [x] (2026-08-19 20:40Z) Milestone 4 — live reads, and the concurrency
      question answered (see Surprises).
- [x] (2026-08-19 21:00Z) Milestone 5 — documentation and closeout.

Add a timestamped entry for every stopping point, splitting a task into
"done" and "remaining" rather than leaving it ambiguous. Example format:

    - [x] (2026-08-19 17:10Z) Milestone 1 complete: migration ran on iOS and
          Android, /db shows "migrations: ok".


## Surprises & Discoveries

Findings from planning are recorded here. Add implementation findings as they
occur, with evidence.

- Observation: The Drizzle Expo driver is **synchronous**, not asynchronous.
  Evidence: `ExpoSQLiteDatabase extends BaseSQLiteDatabase<'sync', SQLiteRunResult, TSchema>`
  in `drizzle-orm/src/expo-sqlite/driver.ts`, and the session's `transaction()`
  takes `(tx) => T` and executes `BEGIN`, the callback, then `COMMIT`, with no
  awaiting. This has a sharp consequence spelled out in the Plan of Work: an
  `async` callback passed to `db.transaction()` would return a promise
  immediately, so `COMMIT` would run before any of the awaited work inside it.
  Every write path in this plan is therefore synchronous.

- Observation: `useLiveQuery` re-runs only when the query's **own** table
  changes. Evidence: `drizzle-orm/src/expo-sqlite/query.ts` subscribes with
  `addDatabaseChangeListener` and compares `config.name === tableName`, where
  `config` is the table or view the query selects from. A query that joins
  `list_items` to `people` therefore will not refresh when a person is renamed.
  It also refuses subqueries and raw SQL outright, setting `error` to
  "Selecting from subqueries and SQL are not supported in useLiveQuery".
  The pattern this plan prescribes follows from that: keep every live query
  single-table and join in JavaScript.

- Observation: mockups `03` and `07` disagree about a list item. The feed card
  in `03` reads "Nina dopisał(-a) 3 rzeczy do listy" with the chips
  "kawa ziarnista · ziemniaki 2 kg · worki 60 l", but the list in `07` contains
  kawa ziarnista and ziemniaki 2 kg and no "worki 60 l" — and its counter says
  "2 z 8", which the eight rows drawn in `07` match exactly. The seed cannot
  satisfy both, because the seed materialises the list *from* the events. It
  follows `07`. This is a new entry for the defect table in `docs/DESIGN.md`.


- Observation: `npx tsc --noEmit` accepts the generated `migrations.js` with no
  declaration file, so the mitigation the plan held in reserve was not needed.
  Evidence: exit code 0 with `src/hooks/useDatabase.ts` importing
  `@/db/migrations/migrations`. `expo/tsconfig.base.json` sets `allowJs: true`
  and leaves `checkJs` off, so the file is resolved but not checked — including
  its `import m0000 from './0000_….sql'` line, which has no resolvable module.

- Observation: `npx expo install expo-sqlite` rewrote `package.json` with
  two-space indentation, discarding the tabs the file used. Restored by
  re-serialising with `JSON.stringify(pkg, null, '\t')`, which preserves key
  order. Worth knowing before reading a diff that looks like the whole file
  changed. Evidence: `git diff --stat package.json` went from 83 changed lines
  back to 7.

- Observation: `npx expo install expo-sqlite` also added `"expo-sqlite"` to the
  `plugins` array in `app.json` by itself. Left in place — it is how the package
  configures its native build, and it is where M11 will later set
  `enableFTS`.


- Observation: `npx expo run:ios` fails at `pod install` when the shell has no
  UTF-8 locale — which is the case for a non-interactive agent shell, though not
  for the repo owner's terminal. Set `LANG=en_US.UTF-8` before building.
  Evidence: `Unicode Normalization not appropriate for ASCII-8BIT
  (Encoding::CompatibilityError)` from
  `cocoapods/config.rb:167:in 'String#unicode_normalize'`, preceded by
  CocoaPods' own warning naming the fix. Nothing to do with this milestone's
  code; the same failure would greet any native rebuild from such a shell.


- Observation: `npx expo run:android` cannot start at all from a shell with no
  `java` on `PATH`, even though `~/.gradle/gradle.properties` pins
  `org.gradle.java.home`. The pin tells Gradle which JDK to *compile* with; the
  `gradlew` launcher still needs a JVM to boot itself.
  Evidence: `The operation couldn't be completed. Unable to locate a Java
  Runtime.` Fixed for the agent shell by exporting
  `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
  and putting `$JAVA_HOME/bin` on `PATH`. The repo owner's terminal already has
  a `java`, so `README.md` stays correct as written.

- Observation: after `~/.gradle/caches` was cleared, the first Android build
  failed applying `com.facebook.react.settings` with
  `java.nio.file.NoSuchFileException: …/caches/9.3.1/transforms/…/settings-plugin.jar`
  — a transform output the freshly-repopulated cache had not produced, held by a
  Gradle daemon started against the old cache. `./gradlew --stop` and a rerun
  fixed it. Nothing needed deleting: the `transforms` directory did not exist at
  all, so this was a stale daemon rather than stale metadata.

- Observation: the bundle proves the whole `.sql` pipeline before the app even
  runs, which makes it the fastest way to check this milestone's riskiest part.
  Evidence: `curl "http://localhost:8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true"`
  returns 200 and contains the migration verbatim as a string literal —
  ``CREATE TABLE `settings` (\n\t`key` text PRIMARY KEY NOT NULL,…`` — and the
  resolver's candidate list in an unrelated error named `.ios.sql|.native.sql|.sql`,
  showing the Metro change took effect. The Metro banner also prints
  `React Compiler enabled`, confirming the new `babel.config.js` did not cost
  the compiler (assumption A2).


- Observation: `expo run:android` can fail *after* a successful compile.
  `BUILD SUCCESSFUL in 11m 34s` was followed by
  `adb: failed to install …: cmd: Failure calling service package: Broken pipe (32)`
  — the emulator's package service dropped the connection. The emulator was
  healthy seconds later (`sys.boot_completed=1`, `pm list packages` answering,
  8.1 GB free), and a plain `adb install -r -d` of the APK Gradle had already
  produced succeeded. Worth knowing before re-running an eleven-minute build:
  check whether the APK exists first.

- Observation: the app shows a black screen on Android for the first ~30 seconds
  after a fresh launch against a cold Metro. This is the 9.5 MB bundle
  downloading, not the migration gate hanging — the root layout returns `null`
  until both fonts and migrations are ready, and `null` paints nothing.
  Something to keep in mind when M7 designs the first-run experience.


- Observation (answers the `useLiveQuery` concurrency question
  `docs/ROADMAP.md` raises for M3): **a burst of writes inside one JavaScript
  tick costs one render, not one per write.** Tapping "Add 20 items", which
  calls `addItem` twenty times in a plain `for` loop — twenty transactions,
  twenty events, twenty inserts — moved the render counter on `/db` from 4 to
  **5**, and the list went from "2 z 8" to "2 z 28". The plan predicted roughly
  twenty re-renders and was wrong.
  Why: expo-sqlite dispatches its change notifications to JavaScript
  asynchronously, so all twenty arrive after the synchronous loop has finished,
  and React 19 batches the resulting state updates into a single pass. The
  caveat that follows: this holds for writes in *one* tick. Writes separated by
  an `await` or spread across ticks would each land in their own batch. M4's
  paste-a-whole-list (`19`) should therefore stay synchronous, and needs no
  debounce layer — none was added.

- Observation: `applyEvent` keeps the log and the tables in step under real use.
  The event list grew by exactly twenty `item.added` rows for twenty new items,
  and "Reset and seed" returned the counts to exactly 8 items, 3 people and 20
  events rather than doubling them.

- Observation: the append-only property is visible rather than theoretical. A
  check followed by an uncheck on the same item leaves **both** `item.checked`
  and `item.unchecked` in the log while the counter returns to "2 z 8" — the
  state is derived, and the history is not rewritten to match it.

- Observation: the exhaustive `switch` works as claimed. Adding
  `'list.archived'` to `EventPayloads` without a reducer branch produced
  `src/db/apply.ts(175,10): error TS2322: Type '{ … type: "list.archived" … }'
  is not assignable to type 'never'.` Reverted after the check.


## Decision Log

- Decision: Store the event log **and** materialised tables, rather than
  deriving lists and notes by folding the log on every read.
  Rationale: reads outnumber writes by a wide margin in this app; `useLiveQuery`
  needs a plain table query to subscribe to (it rejects raw SQL); and M11's FTS5
  index needs real rows to index. The log stays authoritative — it is the thing
  M8 ships — and the tables are its cache.
  Date/Author: 2026-08-19, Claude (planning).

- Decision: One function, `applyEvent()`, is the only code in the app that
  writes to the materialised tables.
  Rationale: this is the single decision that makes M8 an addition rather than a
  rewrite. When the sync loop pulls someone else's event, it calls the same
  function with the same argument shape. Any screen that writes directly to a
  table would be a code path M8 has to find and fix.
  Date/Author: 2026-08-19, Claude (planning).

- Decision: Timestamps are ISO-8601 UTC strings (`new Date().toISOString()`),
  stored in `text` columns, not epoch integers.
  Rationale: they sort correctly as text in SQLite, so `ORDER BY created_at`
  needs no conversion; they map onto Postgres `timestamptz` directly in M8; and
  they are readable when inspecting the database by hand, which matters while
  debugging a log you cannot see through the UI.
  Date/Author: 2026-08-19, Claude (planning).

- Decision: IDs are UUIDv4 from `expo-crypto`'s `randomUUID()`, generated on the
  device, never by SQLite's `AUTOINCREMENT`.
  Rationale: `docs/ROADMAP.md` requires it — two phones creating rows offline
  must not collide, and a row's identity must not change when it reaches the
  server. `expo-crypto` is a first-party Expo package and needs no polyfill.
  Date/Author: 2026-08-19, Claude (planning).

- Decision: The `events` table has **no foreign keys**, while every other table
  does.
  Rationale: `events` is the wire format. In M8 an event may arrive referring to
  a person this device has not yet pulled. A foreign key would reject it and the
  sync loop would have to order its inserts by dependency. The materialised
  tables keep their constraints because they are local and always complete.
  Date/Author: 2026-08-19, Claude (planning).

- Decision: Zustand is not installed in this milestone; it arrives with M8.
  Rationale: the runtime-only state it is meant to hold — connection status,
  sync in flight — is created by M8. An empty store now is scaffolding, and the
  boundary that actually matters (domain data lives in SQLite, never in a store)
  is enforced most strongly by there being no store to misuse. `docs/ROADMAP.md`
  lists the store under M3; `docs/PROJECT.md` describes it as existing. Both
  need a line saying it is deferred — see Milestone 5.
  Date/Author: 2026-08-19, repo owner (answering Q2), plan by Claude.

- Decision: The development check screen at `/db` is labelled in **English**.
  Rationale: `AGENTS.md` constraint 3 requires Polish UI copy taken verbatim
  from a mockup and forbids hand-translation. No mockup exists for a developer
  tool, so writing Polish there would mean inventing product copy — exactly what
  the constraint prevents. English marks the screen as a tool, not a screen. The
  data it displays is of course the Polish seed data from the mockups.
  Date/Author: 2026-08-19, Claude (planning).

- Decision: The seed follows mockup `07` (eight items, no "worki 60 l") where it
  contradicts mockup `03`.
  Rationale: `07` is the list's own screen and is internally consistent — eight
  rows, counter "2 z 8". `03` mentions a third added item that `07` does not
  contain. The feed event the seed writes therefore covers two items, not three.
  Recorded as a new row in `docs/DESIGN.md` → "Known mockup defects".
  Date/Author: 2026-08-19, Claude (planning).

- Decision: Generated migrations live in `src/db/migrations/`, not the
  `drizzle/` directory at the repository root that Drizzle's own documentation
  uses.
  Rationale: the app imports the generated `migrations.js` at runtime. Keeping it
  under `src/` means the import is a short relative path from `src/db/`, keeps
  everything the bundler pulls in below one directory, and avoids a fourth
  top-level folder in a repo whose layout is documented in two places.
  Date/Author: 2026-08-19, Claude (planning).

- Decision: Milestone 2's standalone throwaway probe was folded into
  Milestone 3's seed rather than built separately.
  Rationale: the plan called for a temporary button creating one space, person
  and list to prove that event count and table count move together. The seed
  exercises every action and has exact expected counts (20 events, 8 items, 3
  people, 4 notes), so it proves the same property with code that stays. The
  probe would have been written and deleted the same hour.
  Date/Author: 2026-08-19, Claude (implementation).

- Decision: `SpaceType` values are `'home' | 'work' | 'trip'`, not the Polish
  labels Dom / Praca / Wyjazd that mockup `01` shows.
  Rationale: repo owner's correction during implementation — "nazwy typów zawsze
  po angielsku". A literal-union value is an identifier in the codebase, not UI
  copy, so `AGENTS.md` constraint 3 puts it in English; M7 maps the Polish
  labels at the UI edge. `$type<>()` is compile-time only, so the generated
  migration was unaffected and did not need regenerating.
  Date/Author: 2026-08-19, repo owner, applied by Claude.

- Decision: `peopleInSpace` was split into `allPeople()` and
  `membersOfSpace()` instead of joining `people` to `space_members`.
  Rationale: `useLiveQuery` only refreshes on changes to the table a query
  selects *from*, so a join anchored on `space_members` would not notice M7
  renaming the local person or changing their avatar colour — precisely the
  case that has to update everywhere at once. Screens run both and join by id;
  a Przestrzeń holds a handful of people.
  Date/Author: 2026-08-19, Claude (implementation).

- Decision (answers Q1): a failed migration logs with `console.error` and
  renders nothing. No message is shown to the user.
  Rationale: there is no mockup for this state, and `AGENTS.md` constraint 3
  forbids inventing Polish UI copy — a hand-written message would be exactly the
  invention the constraint exists to prevent. A development build still surfaces
  the error on its red screen, which is where a migration failure is actually
  diagnosed; a release build shows a blank screen, which is honest about the app
  having no usable database. M7 owns first-run states and can revisit it with a
  designed screen rather than an improvised one.
  Date/Author: 2026-08-19, repo owner, plan by Claude.

- Decision (answers Q3): `src/db/events.ts` declares only the eight event types
  M3 implements and exercises. M4 and M5 add their own.
  Rationale: declaring M4's and M5's events now would fix the wire format by
  guessing at payload shapes before the screens that produce them exist — and
  the wire format is the one thing M8 cannot cheaply change later. Growing the
  union is safe because `materialise()` ends in `const unhandled: never = event`,
  so adding a type without a reducer branch fails `npx tsc --noEmit`. A type
  cannot be half-added, which is what makes incremental growth trustworthy.
  Date/Author: 2026-08-19, repo owner, plan by Claude.


## Outcomes & Retrospective

Delivered, on both platforms. Against the three questions the Purpose section
set:

**Does the app hold data across a restart?** Yes, verified by force-quitting on
iPhone 17 and by `am force-stop` on the Android emulator, in both cases coming
back to the same rows.

**Is every change recorded as an event?** Yes. A fresh seed produces exactly the
20 events it should — one `space.created`, three `person.joined`, four
`note.created`, one `note.edited`, one `list.created`, eight `item.added`, two
`item.checked` — and twenty new items added twenty `item.added` rows and nothing
else. Checking an item and unchecking it again leaves both events in the log
while the counter returns to where it started, which is the whole point: state
is derived, history is not rewritten.

**Is `applyEvent()` genuinely the only writer?** Yes, with two intended
exceptions, both documented in the code: `setSetting`, because device-local
settings are not part of any Przestrzeń and would be noise on the wire, and the
`wipe()` helper behind the development-only "Reset and seed" button.

**What M4 will find missing.** The event union covers eight types — enough to
seed and to prove the machinery. M4 needs at least `item.edited`,
`item.deleted`, `item.restored`, `list.renamed`, `list.pinned`,
`list.archived`, and M5 needs `note.deleted`. Adding each is two edits, and the
`never` check makes it impossible to do only one of them. No quick-add parsing,
no archive query and no full-text index exist yet; those belong to M4 and M11.

**What went differently from the plan.** Three things. The concurrency answer
was the opposite of the prediction — batching makes a burst of writes cost one
render, not twenty, which removes a worry M4 would otherwise have had to design
around. The `migrations.js` typing problem the plan held a mitigation in reserve
for never appeared. And every failure encountered during the work was
environmental rather than in the code: a missing UTF-8 locale, a missing `java`
on `PATH`, a stale Gradle daemon, one transient `adb install`. The riskiest part
by design — Drizzle on SDK 57 — worked on the first try, which is an argument
for having front-loaded it into its own milestone rather than a sign the caution
was wasted.


## Context and Orientation

### What this repository is

Peeers is a Polish app for shared shopping lists and notes among people who live
together. It is an Expo SDK 57 project using expo-router's file-based routing:
every file under `src/app/` is a route. TypeScript is strict. There are no
tests and no working linter — `npx tsc --noEmit` is the only automated gate.

Read `AGENTS.md` at the repository root before starting. Its hard constraints
govern this work, in particular: plan before code and wait for the repo owner's
approval; never run `git commit`, `git add` or `git push`; check the versioned
Expo documentation at https://docs.expo.dev/versions/v57.0.0/ rather than
relying on memory; take design values from `src/theme/tokens.ts` and never
invent them; write documentation, code and comments in English while UI copy
stays Polish, taken verbatim from the mockups.

### Routes affected

This milestone adds one route and edits two:

- `src/app/db.tsx` — **new**. A development-only screen that proves the database
  works. It is the direct equivalent of `src/app/gallery.tsx`, which M1 added to
  check design primitives against the mockups and which is still in the tree.
- `src/app/_layout.tsx` — **edited**. The root layout currently blocks rendering
  until fonts load (`if (!fontsLoaded) return null`). It gains a second gate: the
  database migrations must have run first.
- `src/app/(tabs)/profile.tsx` — **edited**. It already contains
  `<Link href="/gallery">`. A second link to `/db` goes beside it. This is how
  you reach the check screen; there is no other entry point.

No other screen changes. `src/app/(tabs)/lists.tsx`, `notes.tsx`, `index.tsx`,
`list/[id].tsx` and `note/[id].tsx` stay exactly as they are — M4, M5 and M6
own them and will consume this data layer then. Resist the temptation to wire
them up here; that is a different milestone and a different review.

### Mockups this milestone relies on

Three, and only as the source of seed data — this milestone builds no product
UI, so nothing here is checked against a mockup for appearance:

- `assets/design/03-feed-przestrzeni.png` — the Przestrzeń name
  "Mieszkanie 14", the three people and their avatar colours, the list summary
  card "Biedronka, sobota — 2 z 8", the notes card "Notatki — 4 · ostatnia
  12:04", and four feed cards.
- `assets/design/07-lista-zakupow.png` — the eight items of "Biedronka,
  sobota" with their quantities, notes and authors, and which two are checked.
- `assets/design/09-lista-notatek.png` — the four note titles and their
  authors.

Two of these appear in `docs/DESIGN.md` → "Known mockup defects", and both
defects touch this plan. The "2 z 8" versus "2 z 6" disagreement between `03`,
`07`, `20`, `27` and `35`, `38` is resolved in favour of `07`'s eight rows. The
`09` versus `14` disagreement about a note hidden from Ala while viewed as Ala
does not matter here, because note visibility is M10 (see A5). A **third**
defect is discovered by this plan and must be added to that table — see the
Decision Log and Milestone 5.

### Theme tokens

**No new tokens.** This milestone measures nothing from a mockup and adds
nothing to `src/theme/tokens.ts`. The `/db` screen is built entirely from
existing primitives in `src/components/ui/` — `Screen`, `Text`, `Card`,
`CheckboxRow`, `SectionLabel`, `Button` — which already read from `useTheme()`.
Seeded avatar colours are taken from the existing `avatarColors` array in
`src/theme/tokens.ts`: index 0 (`#505AC8`, blue) for Ala, index 1 (`#2E7D46`,
green) for Kuba, index 2 (`#C8562A`, orange) for Nina, matching the avatars
drawn in `03`. If you find yourself typing a hex code or a pixel value anywhere
in this milestone, stop — you have gone outside its scope.

### Out-of-scope check

`docs/PROJECT.md` → "Deliberately out of scope" lists feed posts with replies
(messaging), link sharing, moving to a new phone, presence, and the per-person
access screen. One of these intersects this plan: the third feed card in `03`
("Ty — Kto bierze prąd w tym miesiącu? … 1 odpowiedź") is a message with a
reply. **The seed does not create it**, and no event type for it exists. The
other four are untouched.

### Terms used in this plan

- **Event log** — a table whose rows are only ever inserted, never updated or
  deleted. Each row is a statement that something happened: who, what, when.
  Here it is the `events` table defined in `src/db/schema.ts`.
- **Materialise** — to apply an event's effect to the ordinary tables, so that
  reading the current state is a plain `SELECT` instead of a replay of history.
  Here it is the `materialise()` function in `src/db/apply.ts`.
- **Migration** — a numbered SQL file that changes the database's structure.
  Drizzle generates them from the schema; the app applies any it has not applied
  yet at startup, tracking which in a table it manages itself.
- **ORM** — a library that turns TypeScript objects and function calls into SQL.
  Here it is Drizzle, chosen because one schema definition serves both this
  device's SQLite and, in M8, the server's Postgres.
- **Soft delete** — marking a row deleted with a timestamp instead of removing
  it, so it can be restored. Mockup `25` offers "Przywróć" for deleted items, so
  every deletable table in this plan has a `deleted_at` column from the start.
- **`__DEV__`** — a global boolean React Native defines: true when running from
  the Metro bundler, false in a release build. Used here to gate the seed.


## Plan of Work

Five milestones, each independently verifiable. Do not start one before its
predecessor's acceptance criteria pass — Milestone 1 in particular exists to
find out whether the whole approach works before anything is built on it.


### Milestone 1 — The database boots

This milestone answers one question: does Drizzle ORM work on Expo SDK 57 in
this project, with its existing SVG transformer and React Compiler setup? At the
end, the app opens a SQLite database, applies one generated migration containing
a single trivial table, and a development screen says so. No domain data exists
yet.

This is deliberately the riskiest work first. Three separate pieces of build
configuration have to cooperate: Babel must inline `.sql` files as strings,
Metro must treat `.sql` as source rather than an asset, and the existing
`react-native-svg-transformer` customisation in `metro.config.js` must keep
working. If any of it resists, stop and use the fallback in "Idempotence and
Recovery" rather than fighting it — the fallback is a documented, acceptable
outcome, not a failure.

**Scope**

Install the dependencies. `expo-sqlite` is the database itself and
`expo-crypto` generates the IDs; both are Expo packages, so install them with
`npx expo install` so the versions match SDK 57. `drizzle-orm` is the ORM.
`drizzle-kit` (the migration generator) and `babel-plugin-inline-import` are
development-only.

Create `babel.config.js` at the repository root. It does not exist today. Its
whole purpose is the `inline-import` plugin, which replaces
`import sql from './0000_x.sql'` with the file's text at build time — Metro
cannot otherwise read a `.sql` file as a string.

    module.exports = function (api) {
        api.cache(true)
        return {
            presets: ['babel-preset-expo'],
            plugins: [['inline-import', { extensions: ['.sql'] }]],
        }
    }

This file is CommonJS and is excluded from the TypeScript program by
`expo/tsconfig.base.json`, which is why it does not follow the repository's
usual style. Listing `babel-preset-expo` is what keeps Reanimated and the React
Compiler working — see assumption A2.

Edit `metro.config.js`. It currently ends its resolver customisation with

    config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg']

Add `'sql'` to that array. Leave the SVG lines exactly as they are; they are
what makes `src/components/Icon.tsx` work.

Create `drizzle.config.ts` at the repository root:

    import { defineConfig } from 'drizzle-kit'

    export default defineConfig({
        schema: './src/db/schema.ts',
        out: './src/db/migrations',
        dialect: 'sqlite',
        driver: 'expo',
    })

The `driver: 'expo'` line is not decorative: it is what makes `drizzle-kit`
emit an extra `migrations.js` file that bundles the SQL for React Native, on top
of the plain `.sql` files it always writes.

Create `src/db/schema.ts` with **one** table for now — the full schema arrives
in Milestone 2, and starting small means a failure here is unambiguous:

    import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

    /**
     * Device-local key/value settings. Holds `current_person_id` and
     * `current_space_id` — the answers to "who am I" and "which Przestrzeń am I
     * looking at", both of which must survive a restart. M7 adds appearance
     * preferences here.
     */
    export const settings = sqliteTable('settings', {
        key: text('key').primaryKey(),
        value: text('value').notNull(),
    })

**Keep this file free of `@/` imports.** `drizzle-kit` loads it outside Metro,
through its own bundler, which does not read the path aliases in
`tsconfig.json`. A `@/theme` import here would break migration generation with a
confusing module-not-found error.

Create `src/db/client.ts`:

    import { drizzle } from 'drizzle-orm/expo-sqlite'
    import { openDatabaseSync } from 'expo-sqlite'

    import * as schema from './schema'

    /**
     * The raw expo-sqlite handle. `enableChangeListener` is what makes
     * `useLiveQuery` work at all — without it no change notifications are
     * emitted and every screen would show stale data until remounted.
     */
    export const sqlite = openDatabaseSync('peeers.db', {
        enableChangeListener: true,
    })

    // WAL keeps a reader from blocking a writer. Foreign keys are off by
    // default in SQLite and have to be enabled per connection.
    sqlite.execSync('PRAGMA journal_mode = WAL')
    sqlite.execSync('PRAGMA foreign_keys = ON')

    export const db = drizzle(sqlite, { schema })

Add the generation script to `package.json`:

    "db:generate": "drizzle-kit generate"

Run it (see "Concrete Steps"). It writes `src/db/migrations/0000_<name>.sql`,
`src/db/migrations/meta/_journal.json` and `src/db/migrations/migrations.js`.
Commit nothing — leave it in the working tree per `AGENTS.md`.

Create `src/hooks/useDatabase.ts`. `AGENTS.md` says every hook lives in
`src/hooks/`, so the migration gate goes here rather than inline in the layout:

    import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'

    import { db } from '@/db/client'
    import migrations from '@/db/migrations/migrations'

    /**
     * Applies any migrations the device has not run yet. Returns `ready: false`
     * until they finish — the root layout must not render screens before then,
     * because a query against a table that does not exist yet throws.
     */
    export function useDatabase() {
        const { success, error } = useMigrations(db, migrations)
        return { ready: success, error }
    }

Export it from `src/hooks/index.ts` alongside the existing hooks.

Wire it into `src/app/_layout.tsx`. The layout currently reads:

    if (!fontsLoaded) return null

Replace that with a gate that also waits for the database, and surfaces a
migration failure rather than hanging silently on a blank screen:

    const { ready: dbReady, error: dbError } = useDatabase()

    if (dbError) {
        console.error('[db] migrations failed', dbError)
        return null
    }
    if (!fontsLoaded || !dbReady) return null

This is settled, not provisional: a failed migration shows the user nothing.
See the Decision Log for why an invented Polish error message is worse than a
blank screen. Do not add one.

Create `src/app/db.tsx` in its first form: a `Screen` with a `Text` reading the
migration state and the value of one row written to `settings` on mount, so that
you can see a write and a read both work. Add
`<Link href="/db">Database check →</Link>` to `src/app/(tabs)/profile.tsx`,
copying the styling of the existing `/gallery` link on the line above.

**What exists at the end that did not before**

A `peeers.db` file on the device, one applied migration, a screen that proves
both, and — most importantly — the knowledge that the build pipeline works.

**Acceptance**

    npx tsc --noEmit
    # Expected: no output, exit code 0

Then, with the dev server running (`npm run dev`, started by the repo owner —
see the standing rule in "Validation and Acceptance"), open the app on **both**
iOS and Android, go to the "Ty" tab, tap "Database check". The screen shows
"migrations: ok" and the settings value it wrote. Force-quit and reopen: the
value is still there, which proves it came from disk and not from memory.

Also confirm A2 while you are in the app: press and hold any button in
`/gallery` — it must still scale, which means Reanimated's Babel plugin is still
being applied through the new config file.

**Verify before proceeding:** if `migrations.js` fails to bundle, or Metro
throws about the `.sql` extension, or the press animation has stopped working,
do not continue to Milestone 2. Go to "Idempotence and Recovery".


### Milestone 2 — Schema, event log, reducer and actions

With the pipeline proven, this milestone builds the actual data layer: every
table, the event type union, the single writer, and one function per user
action. At the end the app can record events and see them change the tables,
though nothing has put real data in yet.

**Scope**

Expand `src/db/schema.ts` to the full set of tables. Every table uses `text`
primary keys holding UUIDs, and every timestamp is an ISO-8601 UTC string. The
columns are:

`spaces` — `id`, `name`, `type` (one of `dom`, `praca`, `wyjazd`, from the
Przestrzeń types in `docs/PROJECT.md`), `created_at`, `created_by`.

`people` — `id`, `name`, `color`, `created_at`. A person is global, not
per-Przestrzeń: `docs/PROJECT.md` under "Identity" states the name and colour
are global per person.

`space_members` — `space_id`, `person_id`, `role` (`member` or `admin`,
defaulting to `member`), `joined_at`, with a composite primary key of the two
ids. Roles are not implemented until M9; the column exists now because it is
part of the identity model in `docs/PROJECT.md` and adding it later would mean a
migration for no reason.

`lists` — `id`, `space_id`, `title`, `created_at`, `created_by`, `updated_at`,
`pinned_at`, `archived_at`, `deleted_at`. The three nullable timestamps are how
M4 renders its pinned / active / archive sections without a status enum: a list
is pinned if `pinned_at` is set, archived if `archived_at` is set.

`list_items` — `id`, `list_id`, `name`, `quantity` (integer, default 1), `note`,
`position` (integer, for ordering), `created_at`, `created_by`, `checked_at`,
`checked_by`, `deleted_at`. Again the state is in the timestamps: an item is
checked off if `checked_at` is set, and `checked_by` is who did it, which is what
`07` renders on the right of each row.

`notes` — `id`, `space_id`, `title`, `body` (default empty string),
`created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`.

`events` — `id`, `space_id`, `actor_id`, `type`, `payload` (JSON, stored as
text), `created_at`, `synced_at`. The first six columns are deliberately the
exact columns `docs/ROADMAP.md` specifies for M8's Postgres table
(`id, space_id, actor_id, type, payload, created_at`); `synced_at` is the one
local-only addition, and it is null until M8 pushes the row. This is what makes
M8's push a projection rather than a translation.

Add indexes on `events(space_id, created_at)` — M6's feed reads exactly that —
and on `list_items(list_id)`.

Give every table except `events` its foreign keys with `.references()`. See the
Decision Log for why `events` has none.

Create `src/db/events.ts` — the event vocabulary:

    import type { avatarColors } from '@/theme'

    export type SpaceType = 'dom' | 'praca' | 'wyjazd'
    export type Role = 'member' | 'admin'

    /** Every event type this milestone implements, and its payload shape. */
    export type EventPayloads = {
        'space.created': { name: string; type: SpaceType }
        'person.joined': {
            personId: string
            name: string
            color: string
            role: Role
        }
        'list.created': { listId: string; title: string }
        'item.added': {
            itemId: string
            listId: string
            name: string
            quantity: number
            note: string | null
            position: number
        }
        'item.checked': { itemId: string }
        'item.unchecked': { itemId: string }
        'note.created': { noteId: string; title: string; body: string }
        'note.edited': { noteId: string; title: string; body: string }
    }

    export type EventType = keyof EventPayloads

    /**
     * One event. Written as a distributed union rather than a single object
     * with a wide payload type, so that `switch (event.type)` narrows
     * `event.payload` to the right shape in `materialise()`.
     */
    export type AppEvent = {
        [T in EventType]: {
            id: string
            spaceId: string
            actorId: string
            type: T
            payload: EventPayloads[T]
            createdAt: string
        }
    }[EventType]

Create `src/db/apply.ts` — the single writer. **The transaction callback must
be synchronous.** The Drizzle Expo driver runs `BEGIN`, the callback, then
`COMMIT` without awaiting; an `async` callback would return a promise
immediately and the commit would race the work inside it. Every Drizzle query
in this file therefore ends in `.run()`, `.get()` or `.all()`, which execute
synchronously, and no `await` appears anywhere in the file.

    export function applyEvent(event: AppEvent): void {
        db.transaction((tx) => {
            tx.insert(events).values({ ...event, syncedAt: null }).run()
            materialise(tx, event)
        })
    }

    function materialise(tx: Transaction, event: AppEvent): void {
        switch (event.type) {
            case 'space.created': { /* insert into spaces */ return }
            case 'person.joined': { /* insert person + space_members */ return }
            case 'list.created': { /* insert into lists */ return }
            case 'item.added': { /* insert into list_items */ return }
            case 'item.checked': {
                tx.update(listItems)
                    .set({ checkedAt: event.createdAt, checkedBy: event.actorId })
                    .where(eq(listItems.id, event.payload.itemId))
                    .run()
                return
            }
            case 'item.unchecked': { /* null both columns */ return }
            case 'note.created': { /* insert into notes */ return }
            case 'note.edited': { /* update title, body, updated_at/by */ return }
            default: {
                const unhandled: never = event
                throw new Error(
                    `Unhandled event type: ${JSON.stringify(unhandled)}`,
                )
            }
        }
    }

The `const unhandled: never = event` line is load-bearing. Add an entry to
`EventPayloads` without adding a `case` here and `npx tsc --noEmit` fails, so an
event type cannot be half-added. Do not replace it with a plain `throw`.

`person.joined` writes two tables — the person and their membership — inside the
one transaction. That is normal: an event may have several effects, as long as
they are atomic.

Create `src/db/actions.ts` — one exported function per thing a user can do. Each
generates the ids it needs, builds an event, and calls `applyEvent`. None of
them touches a table directly.

    /** Reads the local person's id, written by the seed and later by M7. */
    export function currentPersonId(): string {
        const row = db
            .select()
            .from(settings)
            .where(eq(settings.key, 'current_person_id'))
            .get()
        if (!row) throw new Error('No current person — has the seed run?')
        return row.value
    }

    function newEvent<T extends EventType>(
        spaceId: string,
        type: T,
        payload: EventPayloads[T],
        options?: { actorId?: string; createdAt?: string },
    ): AppEvent {
        return {
            id: randomUUID(),
            spaceId,
            actorId: options?.actorId ?? currentPersonId(),
            type,
            payload,
            createdAt: options?.createdAt ?? new Date().toISOString(),
        } as AppEvent
    }

    export function checkItem(input: { spaceId: string; itemId: string }): void {
        applyEvent(newEvent(input.spaceId, 'item.checked', { itemId: input.itemId }))
    }

The `options` parameter exists for one reason: the seed in Milestone 3 needs to
write events as Kuba and Nina, at yesterday's timestamps. Ordinary UI callers
omit it and get "me, now". Do not expose it any more widely than that.

Write the matching action for each of the eight event types.

Create `src/db/index.ts` re-exporting the public surface — `db`, the actions,
the queries added in Milestone 4, and the types — so screens import from
`@/db` rather than reaching into individual files.

Run `npm run db:generate` again. Because Milestone 1 already generated a
migration, this produces a **second** migration file containing the new tables.
That is correct and expected — migrations accumulate, they are not rewritten.
(If you would rather ship a single clean migration, delete
`src/db/migrations/` entirely, delete the app from the device so its database
goes with it, and regenerate. Only do this before anyone has real data, which is
true right now and will never be true again.)

**What exists at the end that did not before**

Seven tables, an event vocabulary, and a write path that records history as a
side effect of doing work.

**Acceptance**

    npx tsc --noEmit
    # Expected: no output, exit code 0

Temporarily extend `/db` with a button that calls one action — for example
`createList({ spaceId: 'test', title: 'Test' })` after inserting a throwaway
space and person — and render the last five rows of `events` and the row count
of `lists`. Tapping it must add exactly one event row and exactly one list row.
Tap it three times: three events, three lists. Restart the app: all six rows are
still there.

**Verify before proceeding:** the event count and the table count move together,
every time. If a tap ever produces an event with no effect, or an effect with no
event, something has written outside `applyEvent()` and must be fixed now.


### Milestone 3 — The development seed

This milestone fills the database with the contents of mockups `03`, `07` and
`09`, so that M4, M5 and M6 have something to build against and this milestone
has something to demonstrate. At the end, a fresh install shows Mieszkanie 14
with real data.

**Scope**

Create `src/db/seed.ts` exporting `ensureSeed(): void`. It returns immediately
if `settings` already holds `current_person_id`, which makes it safe to call on
every launch. It writes everything through the actions from Milestone 2, with
explicit `actorId` and `createdAt` — so the seed exercises the same path the app
does, and produces a real event log rather than pre-filled tables.

The data, taken from the mockups:

**People.** Ala with `avatarColors[0]`, Kuba with `avatarColors[1]`, Nina with
`avatarColors[2]` — the blue, green and orange avatars in `03`'s header, in that
order. Ala is the local person: after creating her, write her id to
`settings.current_person_id`. All three join as `member`; roles are M9.

**Przestrzeń.** "Mieszkanie 14", type `dom`. Write its id to
`settings.current_space_id`.

**List.** "Biedronka, sobota", created by Ala. Its eight items, in the order
`07` draws them, with `position` 0–7:

    Mleko owsiane        quantity 2   note —              added by Kuba
    Serek wiejski        quantity 1   note —              added by Ala
    Pomidory malinowe    quantity 1   note —              added by Ala
    Ziemniaki 2 kg       quantity 1   note —              added by Nina
    Papier toaletowy     quantity 1   note "duża paczka"  added by Nina
    Kawa ziarnista       quantity 1   note —              added by Nina
    Masło                quantity 1   note —              added by Kuba
    Chleb                quantity 1   note —              added by Kuba

Note that "Ziemniaki 2 kg" carries its amount in the name while "Mleko owsiane"
uses the quantity field rendered as "×2". Both are copied verbatim from `07`;
M4's quick-add parsing decides which convention wins going forward.

Then check off Masło and Chleb as Kuba, at today 12:41 local time — the
"ODHACZONE · 2" section in `07` and the "Kuba odhaczył(-a) chleb i masło · 12:41"
card in `03` are the same two events.

The kawa ziarnista and ziemniaki items are added by Nina at today 11:07, so that
M6's feed can group them into the one "Nina dopisał(-a) …" card `03` draws.
That card claims three items; the list has two of them. See the Decision Log —
`07` wins, and `docs/DESIGN.md` gains a defect row in Milestone 5.

**Notes.** Four, matching `09`: "Kod do bramy i wifi" by Nina, "Pomysły na
urodziny Ali" by Nina, "Rachunki i terminy" by Ala, "Co zabrać w Bieszczady" by
Kuba. Give "Kod do bramy i wifi" the body shown in
`assets/design/10-widok-notatki.png`, copied verbatim, and leave the other three
bodies empty — M5 owns note content and will not thank you for invented Polish.
Finish with a `note.edited` event on "Kod do bramy i wifi" by Nina at
**yesterday** 12:04, which is the fourth feed card in `03`.

**Timestamps.** Compute every one relative to `new Date()` — today at 12:41,
today at 11:07, yesterday at 12:04, a few days ago for the older notes. Never
hard-code a date. The feed in M6 groups by day under "DZIŚ W PRZESTRZENI", so a
seed written in absolute dates would stop looking right the day after it was
written.

**Not seeded:** the third feed card in `03`, "Ty — Kto bierze prąd w tym
miesiącu? … 1 odpowiedź". It is a message with a reply, which
`docs/PROJECT.md` puts out of scope. Leave it out and do not add an event type
for it.

Call `ensureSeed()` from `src/hooks/useDatabase.ts`, after migrations succeed
and only when `__DEV__` is true:

    export function useDatabase() {
        const { success, error } = useMigrations(db, migrations)
        const [seeded, setSeeded] = useState(!__DEV__)

        useEffect(() => {
            if (!success || seeded) return
            ensureSeed()
            setSeeded(true)
        }, [success, seeded])

        return { ready: success && seeded, error }
    }

Add two buttons to `/db`: "Reset and seed", which deletes every row from every
table inside one transaction and calls `ensureSeed()` again, and "Add 20 items",
which Milestone 4 uses. Deleting rows rather than the database file means no app
reload is needed and the open connection stays valid.

**What exists at the end that did not before**

A database whose contents match the mockups, reachable by every later milestone,
and reproducible with one tap.

**Acceptance**

    npx tsc --noEmit
    # Expected: no output, exit code 0

Delete the app from the device (this deletes its database), reinstall, open
`/db`. Without touching anything you see: Mieszkanie 14; three people; one list
titled "Biedronka, sobota" with the counter "2 z 8"; eight item rows with Masło
and Chleb marked checked; four notes; and an event list whose newest entries are
the two `item.checked` events at 12:41.

Count the events: **20** — one `space.created`, three `person.joined`, one
`list.created`, eight `item.added`, two `item.checked`, four `note.created`, one
`note.edited`. If the count differs, the seed is writing outside the event path
or writing twice.

Tap "Reset and seed". The counts return to exactly the same numbers, not double.

**Verify before proceeding:** relaunching the app does not add a second copy of
anything. That is what makes `ensureSeed()` safe to call unconditionally.


### Milestone 4 — Live reads, and the concurrency question

The final piece of the data layer: reading. This milestone adds the query module
and makes `/db` reactive, then answers the question `docs/ROADMAP.md` raises
about `useLiveQuery` under concurrent writes.

**Scope**

Create `src/db/queries.ts`. Each function returns a Drizzle query **without
executing it** — `useLiveQuery` needs the builder object, not its result:

    export function itemsInList(listId: string) {
        return db
            .select()
            .from(listItems)
            .where(and(eq(listItems.listId, listId), isNull(listItems.deletedAt)))
            .orderBy(listItems.position)
    }

Used from a screen as:

    const { data: items } = useLiveQuery(itemsInList(listId), [listId])

**The constraint that shapes this module:** `useLiveQuery` re-runs only when the
table the query selects *from* changes — it compares the changed table's name
against the query's own table. A join to `people` therefore will not refresh
when a person is renamed, and the hook rejects raw SQL and subqueries outright.
So every function here selects from exactly one table, and screens that need
author names run a second live query for `people` and join the two in
JavaScript. This is cheap — a Przestrzeń has a handful of people — and it is the
only pattern that stays correct. Write that rule in a comment at the top of the
file so M4 does not rediscover it.

Provide at minimum: `spaceById`, `peopleInSpace`, `listsInSpace`,
`itemsInList`, `notesInSpace`, and `recentEvents(spaceId, limit)`.

Rebuild `/db` on these queries: the Przestrzeń header, the people, the list with
its "n z m" counter computed from the items, the item rows as `CheckboxRow`
primitives whose `onPress` calls `checkItem` / `uncheckItem`, the note titles,
and the twenty most recent events. Nothing on the screen may come from
`useState` holding domain data — if it does, the milestone has failed its own
point.

**The concurrency probe.** `docs/ROADMAP.md` asks how `useLiveQuery` behaves
under writes from several places at once. Answer it by measurement, not
reasoning. Add a render counter to `/db`:

    const renders = useRef(0)
    renders.current += 1

Display it. Then tap "Add 20 items", which calls `addItem` twenty times in a
loop, and record how far the counter moves. Then change the button to wrap the
same twenty calls in a single `db.transaction(...)` and record it again. Write
both numbers into "Surprises & Discoveries" with what they imply.

The expected result, to be confirmed or refuted: each `INSERT` fires its own
change notification, so twenty separate writes cause on the order of twenty
re-queries and re-renders, while twenty writes inside one transaction may
coalesce — or may not, if expo-sqlite emits per row regardless of transaction
boundaries. If the un-batched number is large enough to drop frames, note it as
a constraint for M4's quick-add and paste-a-whole-list features (`19` pastes an
entire list at once), and record the batching workaround. Do **not** add a
debounce layer in this milestone; measure, record, and let M4 act on real UI.

**What exists at the end that did not before**

The complete read path, and a documented answer to a question the roadmap has
been carrying since it was written.

**Acceptance**

    npx tsc --noEmit
    # Expected: no output, exit code 0

On the running app, on **both** iOS and Android, in **both** light and dark
themes (`AGENTS.md` requires both; the dark theme has its own token values and
breaks quietly):

1. Open `/db`. Tap the circle next to "Mleko owsiane". The counter goes from
   "2 z 8" to "3 z 8" with no navigation and no refresh, and a new
   `item.checked` event appears at the top of the event list.
2. Tap it again. "3 z 8" returns to "2 z 8" and an `item.unchecked` event
   appears. The `item.checked` event is **still there** — this is an append-only
   log, and seeing both rows is the proof.
3. Force-quit from the app switcher, reopen, return to `/db`. The state is
   exactly as you left it.
4. Tap "Add 20 items" and note the render counter before and after.

**Verify before proceeding:** step 2 is the one that matters. If the
`item.checked` row disappeared when you unchecked, something is updating the log
instead of appending to it, and M8 would lose history.


### Milestone 5 — Documentation and closeout

`AGENTS.md` says documentation is part of the change, not a follow-up. Four
documents need edits, and its "Keeping docs current" section names three of them
explicitly for the change this milestone makes.

`docs/ROADMAP.md` — mark M3 done in the milestone table and in "Where the
project stands"; answer both of the "two things to check" M3 raised, since this
plan answers them (how `drizzle-kit` migrations are bundled, and how
`useLiveQuery` behaves under concurrent writes); state whether the Drizzle path
held or the fallback was taken.

`AGENTS.md` — add `src/db/` to the code layout table ("the data layer: schema,
event log, actions and queries"); add `npm run db:generate` to the Verification
section. Adding an npm script triggers a three-file rule.

`README.md` — add `src/db/` to the Layout table, and `npm run db:generate` with
a sentence saying it regenerates migrations after a schema edit.

`docs/exec-plans/create-plan-file.md` — the "Project-Specific Conventions"
section repeats the command list and must gain `db:generate` too; also update
its Tech Stack Reference, which still claims the project "runs in Expo Go (no
dev build needed)" and that `react-native-svg-transformer` is not installed —
both are now false.

`docs/DESIGN.md` — add the new mockup defect found while planning: `03`'s feed
card lists three added items ("kawa ziarnista · ziemniaki 2 kg · worki 60 l")
while `07` contains only the first two and counts eight rows.

`docs/PROJECT.md` — its "State on the device" section describes "the small
Zustand store" as though it exists. It does not, and will not until M8. Add a
sentence saying so, so the document does not send the next contributor looking
for a file that was never written. Leave the surrounding rule intact — the
boundary it draws (domain data in SQLite, never in a store) is what this
milestone implements, and it holds whether or not the store exists yet.

**Acceptance**

    npx tsc --noEmit
    # Expected: no output, exit code 0

    git status --porcelain
    # Expected: only the files this plan names, all unstaged.

Fill in `Outcomes & Retrospective`, then move this file to
`docs/exec-plans/completed/`. Propose a commit message as text; do not run
`git commit`, `git add` or `git push`.


## Concrete Steps

All commands run from the repository root,
`/Users/szymon/Documents/projects/peeers`.

Install the Expo packages with `npx expo install` so their versions match SDK
57 rather than whatever npm considers latest:

    npx expo install expo-sqlite expo-crypto
    # Expected: adds expo-sqlite@~57.0.1 and expo-crypto@~57.x to package.json

The ORM and its tooling are ordinary npm packages:

    npm install drizzle-orm
    npm install --save-dev drizzle-kit babel-plugin-inline-import
    # Expected: drizzle-orm@^0.45.2, drizzle-kit@^0.31.10,
    #           babel-plugin-inline-import@^3.0.0

Generate a migration after every change to `src/db/schema.ts`:

    npm run db:generate
    # Expected transcript:
    # Reading config file 'drizzle.config.ts'
    # 7 tables
    # events 7 columns 1 indexes 0 fks
    # ...
    # [✓] Your SQL migration file ➜ src/db/migrations/0001_<name>.sql 🚀

Type check — the only automated gate this repository has:

    npx tsc --noEmit
    # Expected: no output, exit code 0

After editing `babel.config.js` or `metro.config.js`, Metro must be restarted
with its cache cleared or it will keep serving the old transform:

    npx expo start --dev-client --clear

This repository has **no test command and no usable lint command**. Do not
invent one. `npm run lint` opens an interactive ESLint wizard and must not be
run casually.


## Validation and Acceptance

Two standing rules from `AGENTS.md` apply throughout, and both are strict:

**Do not start the iOS Simulator or the Android emulator.** The repo owner keeps
them running. If no device is booted, say so and start nothing — no
`Simulator.app`, no `emulator -avd`, no `simctl boot`. Driving a device that is
already up is verification, not launching, and is fine: `simctl io`/`ui`/
`openurl` on iOS, `adb screencap`/`input`/`shell` on Android.

**The repo owner runs the dev server.** If you start one for your own
verification, stop it afterwards and leave port 8081 free.

Both platforms run from a **development build**, not Expo Go. The bundler is:

    npm run dev

then press `i` or `a`. Android builds need JDK 17, pinned in
`~/.gradle/gradle.properties`; see `README.md`. A rebuild
(`npm run android` / `npm run ios`) is needed only when native code changes —
and installing `expo-sqlite` and `expo-crypto` **is** a native change, so both
platforms must be rebuilt once after the installs in Milestone 1. Budget for
this: the Android build took roughly ten minutes on this machine.

The end-to-end acceptance for the whole milestone, on both platforms and in both
themes:

1. Fresh install. Open the app, go to "Ty", tap "Database check".
2. Mieszkanie 14, three people, "Biedronka, sobota — 2 z 8", eight items with
   Masło and Chleb checked, four notes, twenty events.
3. Tap "Mleko owsiane". Counter → "3 z 8" with no refresh; a new event appears.
4. Tap it again. Counter → "2 z 8"; a second event appears; the first remains.
5. Force-quit, reopen, return to the screen. Everything is as you left it.
6. Switch the device to dark mode. The screen is legible and uses theme colours
   throughout — no hard-coded white or black anywhere.

Step 4 is the milestone's real acceptance test. Everything else could be
achieved with a plain table; only the growing log proves the design M8 depends
on.


## Idempotence and Recovery

**Every step here is safe to repeat.** `npm run db:generate` is additive: run it
twice with no schema change and it writes nothing. `useMigrations` records what
it has applied in a table it manages itself, so migrations never run twice.
`ensureSeed()` checks for `settings.current_person_id` and returns immediately if
the database is already populated.

**To start over from an empty database**, use the "Reset and seed" button on
`/db`, which deletes every row inside one transaction and re-seeds. To go
further and discard the schema too, delete the app from the device — the
database file goes with it — and reinstall.

**If Metro behaves strangely after a config change**, the cause is almost always
its cache. Restart with `--clear`. This is the first thing to try when a `.sql`
import resolves to `undefined` or an inlined migration comes back empty.

**The fallback, if Drizzle does not work on SDK 57.** `docs/ROADMAP.md` states
it: raw SQL over `expo-sqlite`, plus a thin hook on `addDatabaseChangeListener`
in place of `useLiveQuery`. Concretely that means keeping `src/db/`'s shape and
every interface in this plan exactly as designed — `applyEvent`, `actions`,
`queries`, the event union — and changing only their bodies: hand-written
`CREATE TABLE` statements run from an `onInit` callback on `SQLiteProvider`
instead of generated migrations, `db.runSync`/`getAllSync` instead of Drizzle
builders, and a `useLiveRows(sql, params, tables)` hook in `src/hooks/` that
subscribes to `SQLite.addDatabaseChangeListener` and re-queries when one of the
named tables changes. What is lost: compile-time column typing, generated
migrations, and the shared schema definition M8 wanted for Postgres. What is
gained: two fewer dependencies and no Babel or Metro configuration at all —
`babel.config.js` and the `.sql` source extension both exist solely for Drizzle's
migration bundling.

Take the fallback only after Milestone 1 fails on both platforms, and record why
in the Decision Log with the exact error. Do not take it because something felt
awkward.

**Leaving the environment clean.** Stop any dev server you started. Leave all
changes unstaged in the working tree — `AGENTS.md` constraint 0 is absolute:
never run `git commit`, `git add` or `git push`, never create a branch or a PR.
Propose a commit message as text at the end.


## Artifacts and Notes

Expected shape of the generated migration directory after Milestone 2:

    src/db/migrations/
    ├── 0000_<adjective>_<name>.sql      plain SQL, applied on device
    ├── 0001_<adjective>_<name>.sql
    ├── meta/
    │   ├── _journal.json                which migrations exist, in order
    │   ├── 0000_snapshot.json           schema state, used to diff the next one
    │   └── 0001_snapshot.json
    └── migrations.js                    generated only because driver: 'expo'

`migrations.js` is the file that makes this work on a phone. It imports each
`.sql` file, which `babel-plugin-inline-import` turns into a string literal at
build time, and exports them with the journal for `useMigrations` to apply. It
is generated, not written — never edit it by hand.

A note on TypeScript and that file: it is JavaScript with no type declarations,
imported from TypeScript. `expo/tsconfig.base.json` sets `allowJs: true` and
`checkJs` is off, so `npx tsc --noEmit` should accept it. If it does not — if
you see "Could not find a declaration file for module" — add a two-line
declaration in `src/types/` mirroring `src/types/svg.d.ts`, which exists for
exactly this reason with `.svg` imports. Record it in Surprises & Discoveries
if it happens.

Useful evidence to capture as you go: the `db:generate` transcript, the event
count after a fresh seed, the render-counter numbers from the concurrency probe,
and a screenshot of `/db` in both themes.


## Interfaces and Dependencies

### Dependencies added

`expo-sqlite` (`~57.0.1`) — the database. First-party Expo, and the only SQLite
option that ships with a change listener (`addDatabaseChangeListener`), which is
what makes reactive reads possible without a polling loop.

`expo-crypto` (`~57.x`) — `randomUUID()`, for device-generated ids. First-party,
no polyfill needed; React Native has no global `crypto.randomUUID`.

`drizzle-orm` (`^0.45.2`) — the ORM. `docs/ROADMAP.md` states why it earns its
place: one typed schema definition serves both this device's SQLite and, in M8,
the Supabase Postgres, and `drizzle-kit` generates migrations, which stop being
optional the moment the app ships with data on a phone. Declares
`expo-sqlite: >=14.0.0` as a peer dependency, which `57.0.1` satisfies.

`drizzle-kit` (`^0.31.10`, dev) — generates migrations from the schema. Never
runs on the device.

`babel-plugin-inline-import` (`^3.0.0`, dev) — inlines `.sql` files as strings at
build time. Required by Drizzle's generated `migrations.js`.

**Not added:** Zustand — deferred to M8, see the Decision Log — TanStack Query (`docs/ROADMAP.md` forbids it —
screens never await the network, because M8's sync loop writes into SQLite in the
background), and any state manager for domain data. `docs/PROJECT.md` is
explicit: SQLite **is** the application state.

Note that `reactCompiler` is enabled in `app.json`. Do not hand-write `useMemo`,
`useCallback` or `memo` anywhere in this milestone, and do not choose anything
for re-render performance.

### Interfaces that must exist at the end

    // src/db/events.ts
    export type SpaceType = 'dom' | 'praca' | 'wyjazd'
    export type Role = 'member' | 'admin'
    export type EventPayloads = { /* eight entries, see Milestone 2 */ }
    export type EventType = keyof EventPayloads
    export type AppEvent = /* distributed union over EventType */

    // src/db/apply.ts
    export function applyEvent(event: AppEvent): void

    // src/db/actions.ts
    export function currentPersonId(): string
    export function currentSpaceId(): string
    export function createSpace(input: { name: string; type: SpaceType }): string
    export function addPerson(input: {
        spaceId: string
        name: string
        color: string
        role?: Role
    }): string
    export function createList(input: { spaceId: string; title: string }): string
    export function addItem(input: {
        spaceId: string
        listId: string
        name: string
        quantity?: number
        note?: string | null
    }): string
    export function checkItem(input: { spaceId: string; itemId: string }): void
    export function uncheckItem(input: { spaceId: string; itemId: string }): void
    export function createNote(input: {
        spaceId: string
        title: string
        body?: string
    }): string
    export function editNote(input: {
        spaceId: string
        noteId: string
        title: string
        body: string
    }): void

    // src/db/queries.ts — each returns an unexecuted Drizzle query,
    // selecting from exactly one table (see Milestone 4).
    export function spaceById(spaceId: string)
    export function peopleInSpace(spaceId: string)
    export function listsInSpace(spaceId: string)
    export function itemsInList(listId: string)
    export function notesInSpace(spaceId: string)
    export function recentEvents(spaceId: string, limit: number)

    // src/db/seed.ts
    export function ensureSeed(): void

    // src/hooks/useDatabase.ts
    export function useDatabase(): { ready: boolean; error: Error | undefined }

Every one of these is synchronous except the migration hook. That is a
consequence of the Drizzle Expo driver being synchronous, and it is a feature:
no screen in this app ever awaits its own data.

### The contract M8 depends on

Three properties must hold when this milestone closes, because M8 is built on
them and cannot repair them cheaply:

1. `applyEvent()` is the only function in the codebase that writes to `spaces`,
   `people`, `space_members`, `lists`, `list_items` or `notes`. Grep for
   `db.insert`, `db.update` and `db.delete` outside `src/db/apply.ts` — the only
   permitted hits are the `events` insert in `apply.ts` itself, the `settings`
   writes, and the "Reset and seed" button.
2. Rows in `events` are never updated or deleted. The single exception M8 will
   add is setting `synced_at` after a successful push.
3. Every id is generated on the device before the row is written, never by the
   database.


## Revision note

2026-08-19 — initial version. Written from `docs/ROADMAP.md` → M3, with the
Drizzle and expo-sqlite details checked against the SDK 57 documentation and the
installed `babel-preset-expo` rather than from memory, per `AGENTS.md`
constraint 1. Three questions were left open for the repo owner (migration
failure copy, Zustand timing, event-union completeness); none blocked Milestone 1.

2026-08-19 — the repo owner answered all three: blank screen on a failed
migration, Zustand deferred to M8, and eight event types rather than a complete
union. Open Questions is now empty, the three answers are in the Decision Log
with their rationale, and three sections changed as a consequence. Milestone 1's
error gate is stated as settled rather than assumed. Milestone 5's edit to
`docs/PROJECT.md` moved from conditional to required, because deferring the
store leaves that document describing a file that does not exist. The
"Not added" paragraph under Interfaces and Dependencies now points at the
decision instead of the question.
