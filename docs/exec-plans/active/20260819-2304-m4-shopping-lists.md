# M4 — Shopping lists: the core loop on one device

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
It implements milestone **M4** from `docs/ROADMAP.md`.

A note on the code samples below: they are indented with spaces so that markdown
renders them as code blocks. The repository itself is written with **tab
indentation and no semicolons** in the newer files — match `src/theme/tokens.ts`,
`src/app/_layout.tsx`, `src/app/new.tsx` and everything under `src/db/`. Some
older files (`src/components/ui/*`, `src/app/gallery.tsx`, `src/hooks/*`) are
2-space with semicolons; when you edit one of those, match the file you are in
rather than converting it.


## Purpose / Big Picture

This is the milestone the app exists for. Everything before it was scaffolding:
M1 drew the pieces, M2 wired the navigation, M3 put a real database on the phone.
The screens that actually do the work are still stubs — open
`src/app/(tabs)/lists.tsx` today and you get a heading, one line of grey text and
a link to a list screen that says "Szczegóły listy — makieta 07".

After this change a person who lives in a shared flat can do the whole loop
without leaving the app:

- see every list in the Przestrzeń on one screen, with a pinned list at the top,
  the active ones under it, and a way into the archive;
- open a list, tick something off, and watch the counter move and the row travel
  down into "ODHACZONE";
- type `mleko owsiane x2` into the bar at the bottom and get an item called
  "Mleko owsiane" with a quantity of 2 — or `papier, duża paczka` and get an item
  with a note on it;
- tick something off with a tap anywhere on its row, hold the same row to open
  a sheet where the name, the quantity and the note can be changed or the item
  deleted, or drag it sideways to do either without aiming;
- paste six lines out of a note and get six items, with the quantities picked out
  of the text;
- open "Historia zmian", see who did what and when, and press "Przywróć" next to
  something that was removed or checked off by mistake;
- and, when everything on a list is checked, watch that list move itself into the
  archive, where it can still be reopened, copied onto a fresh list, or thrown
  away.

None of that touches the network. It is one device, one Przestrzeń, and the
event log built in M3. Every one of those actions appends an event, and the
history screen is that log read back — which is the second reason this milestone
matters. M6 renders the same log as the Przestrzeń feed and M8 ships it to a
server; if M4 wrote rows directly instead of appending events, both of those
would have to be rebuilt on top of a data layer that had already gone wrong.

**How you will see it working.** Start the dev server, open the app on a booted
device, and go to the "Zakupy" tab. You will see "Biedronka, sobota" pinned at
the top with a filled counter badge and a half-filled progress bar, three active
lists under it, and an "ARCHIWUM" section. Open "Biedronka, sobota": eight items
under "DO KUPIENIA" and "ODHACZONE · 2", exactly as mockup `07` draws them. Type
`ser żółty x3` into the bar at the bottom and press the round accent button. A
row appears reading "Ser żółty" with "×3 · Ty" under it. Tick the six unchecked
items one by one; when the last one goes, the list is no longer in the Zakupy
tab — it is in the archive, dated today. Force-quit the app, reopen it: all of
it is still true.


## Bird's Eye View

### Routes — before

    src/app/
      (tabs)/
        index.tsx      Przestrzeń   stub
        lists.tsx      Zakupy       stub  ← 3 lines of placeholder text
        notes.tsx      Notatki      stub
        profile.tsx    Ty           stub + a link to /db
      list/[id].tsx    list detail  stub  ← "Szczegóły listy — makieta 07"
      note/[id].tsx    note detail  stub
      new.tsx          "Co tworzymy" sheet — both options call router.back()
      db.tsx           development check screen
      gallery.tsx      component gallery

### Routes — after

    src/app/
      (tabs)/
        lists.tsx              35  the real index: pinned / active / archive
      list/
        [id]/
          index.tsx            07 39 15   detail (moved from list/[id].tsx)
          history.tsx          25         change history, with restore
          paste.tsx            19         paste a whole list   (modal)
          menu.tsx             —          the list's "..." sheet  (D-Q2)
          rename.tsx           —          rename sheet            (D-Q3)
      item/[id].tsx            28         item detail             (formSheet)
      archive.tsx              41         the archive
      new-list.tsx             —          "Nowa lista" sheet      (D-Q3)
      new.tsx                  05         "Lista zakupów" now creates a list

Routes marked "—" have no mockup of their own; their shape comes from D-Q2 and
D-Q3 in the Decision Log.

### What each screen reads and writes

    ┌──────────────────────────────────────────────────────────────────────┐
    │ src/app/(tabs)/lists.tsx                          mockup 35          │
    │   reads   listsInSpace(spaceId)          live, table `lists`         │
    │           itemCountsByList()             live, table `list_items`    │
    │           listActivity(spaceId, 200)     live, table `events`        │
    │           allPeople()                    live, table `people`        │
    │   writes  nothing (navigates only)                                   │
    └──────────────────────────────────────────────────────────────────────┘
    ┌──────────────────────────────────────────────────────────────────────┐
    │ src/app/list/[id]/index.tsx                    mockups 07, 39, 15    │
    │   reads   listById(id), itemsInList(id), allPeople()                 │
    │   writes  checkItem / uncheckItem / addItem                          │
    └──────────────────────────────────────────────────────────────────────┘
    ┌──────────────────────────────────────────────────────────────────────┐
    │ src/app/item/[id].tsx                             mockup 28          │
    │   reads   itemById(id), allPeople()                                  │
    │   writes  editItem / removeItem                                      │
    └──────────────────────────────────────────────────────────────────────┘
    ┌──────────────────────────────────────────────────────────────────────┐
    │ src/app/list/[id]/history.tsx                     mockup 25          │
    │   reads   eventsForList(listId), itemsInList(id), allPeople()        │
    │   writes  uncheckItem / restoreItem   ("Przywróć")                   │
    └──────────────────────────────────────────────────────────────────────┘
    ┌──────────────────────────────────────────────────────────────────────┐
    │ src/app/archive.tsx                               mockup 41          │
    │   reads   listsInSpace(spaceId), itemCountsByList()                  │
    │   writes  unarchiveList / deleteList                                 │
    └──────────────────────────────────────────────────────────────────────┘

Every "live" read above is `useLiveQuery` from `drizzle-orm/expo-sqlite`, which
re-runs a query when the one table it selects **from** changes. Every write is a
function in `src/db/actions.ts`, which builds an event and hands it to
`applyEvent` in `src/db/apply.ts`. No screen touches a table directly. That rule
is already in force — see the header comments of `src/db/queries.ts` and
`src/db/index.ts` — and this milestone does not bend it.

### Key changes

    ADDED       src/lib/                    pure helpers: no React, no database
                  plural.ts                 Polish plural forms
                  time.ts                   "wczoraj", "w piątek", "12 sierpnia"
                  parseItem.ts              "mleko x2" → { name, quantity, note }
                  eventText.ts              an event → a Polish sentence
                src/components/ui/TextField.tsx    28's two field looks
                src/components/ui/Stepper.tsx      28's − 1 + control
                src/app/list/[id]/history.tsx      25
                src/app/list/[id]/paste.tsx        19
                src/app/list/[id]/menu.tsx         the "..." sheet
                src/app/list/[id]/rename.tsx       rename sheet
                src/app/item/[id].tsx              28
                src/app/archive.tsx                41
                src/app/new-list.tsx               "Nowa lista" sheet
                one migration under src/db/migrations/

    CHANGED     src/db/events.ts            9 new event types
                src/db/apply.ts             9 new branches + events.list_id
                src/db/schema.ts            events.list_id, one index
                src/db/actions.ts           9 new actions
                src/db/queries.ts           the reads listed above
                src/db/seed.ts              4 active + 5 archived lists
                src/app/_layout.tsx         the new stack routes
                src/app/(tabs)/lists.tsx    stub → 35
                src/app/list/[id].tsx       moved to list/[id]/index.tsx → 07
                src/app/new.tsx             "Lista zakupów" creates a list
                src/app/db.tsx              events rendered as sentences
                src/components/ui/SectionLabel.tsx   optional icon + right slot
                src/components/ui/CheckboxRow.tsx    checked row dims as a whole
                src/app/gallery.tsx         the two new primitives
                docs/DESIGN.md              two new mockup defects
                docs/ROADMAP.md             M4 marked done at the end
                AGENTS.md, README.md        the src/lib row

    UNCHANGED   src/theme/tokens.ts         unless a measurement demands a token,
                                            and then only with a source comment
                src/app/(tabs)/index.tsx    M6 owns the feed
                src/app/(tabs)/notes.tsx    M5 owns notes
                src/app/note/[id].tsx       M5
                everything to do with sync  M8

### Data flow, traced end to end

    User types "papier, duża paczka" into the bar on /list/<id> and taps ↑
      │
      ├─ 1. parseItem("papier, duża paczka")           src/lib/parseItem.ts
      │       → { name: "Papier", quantity: 1, note: "duża paczka" }
      │         (pure function, no database, no React)
      │
      ├─ 2. addItem({ spaceId, listId, name, quantity, note })
      │                                                 src/db/actions.ts
      │       reads max(position) for the list, builds an AppEvent:
      │         id: randomUUID()  type: "item.added"  actorId: currentPersonId()
      │
      ├─ 3. applyEvent(event)                           src/db/apply.ts
      │       ONE transaction:
      │         INSERT INTO events    (… list_id = payload.listId …)
      │         INSERT INTO list_items(…)
      │         UPDATE lists SET updated_at = …
      │
      ├─ 4. expo-sqlite fires its change listener for `list_items`,
      │       then for `lists`, then for `events`
      │
      ├─ 5. useLiveQuery re-runs itemsInList(listId) on the detail screen and,
      │       when that screen is popped, listsInSpace + itemCountsByList on
      │       the index
      │
      └─ 6. The row appears under DO KUPIENIA reading
              "Papier"  /  "duża paczka · Ty",
            the header counter goes from "2 z 8" to "2 z 9",
            and /list/<id>/history gains a row
              "23:14   Ty dopisał(-a) Papier"

    Nothing above is specific to this device. In M8 the same `applyEvent` call
    is made with an event pulled off the network, and steps 4–6 are identical.


## Assumptions

These unblock planning. Each must be confirmed and moved to the Decision Log, or
removed, before this plan is closed.

**A1. "Udostępnij" is omitted, not stubbed.** Mockups `07`, `15` and `28` put an
"Udostępnij" action in the header. `docs/PROJECT.md` drops link sharing from the
MVP and says in as many words that this action "has nothing to do — do not
implement it". A button that does nothing is the exact failure mode
`docs/exec-plans/create-plan-file.md` calls a letter-of-the-law implementation,
so the header slot is given to the "..." menu instead (D-Q2).

**A2. Per-list membership is not modelled.** The bottom two rows of mockup `25`
read "Kuba dołączył(-a) do listy" and "Ty udostępnił(-a) listę całej
Przestrzeni". Both describe a per-list access model. `docs/PROJECT.md` puts the
per-person access screen out of scope and drops link sharing, and a list in this
product belongs to a Przestrzeń, not to a subset of its people. The history
screen therefore never renders those two sentences, because no event produces
them.

**A3. Suggestions come from this Przestrzeń's own history, archive included.**
Mockup `41` states the rule outright: "Z archiwum bierzemy podpowiedzi przy
dopisywaniu." So the "CZĘSTE U WAS" chips on `08` and `15` are the item names
used most often across every list in the Przestrzeń, archived ones included,
minus the names already on the list in front of you.

**A4. Where `07` and `39` disagree, `07` wins.** They are the light and dark
drawings of the same screen and they contradict each other twice — see "Known
mockup defects" below, which this plan adds a row to. `07` is the primary,
light-theme reference and is internally consistent with `28`.

**A5. Roles are not enforced.** `docs/ROADMAP.md` puts roles in M9. The
`space_members.role` column exists and the seed makes Ala an admin, but nothing
in M4 checks it. Anyone can delete any list.

**A6. The appearance settings of mockup `22` are M7.** In particular "ukryj
odhaczone" — the "ODHACZONE" group is always rendered here — and the text-size
scale. Do not add a settings read to any screen in this milestone.

**A7. No search, no note visibility.** M11 owns search over items and the
archive; M10 owns note visibility. This milestone adds no FTS index and no
visibility column.

**A8. Keyboard avoidance is unproven in this repo.** No screen has had a text
input at the bottom of the viewport before. Milestone 3 opens with a spike
rather than assuming `KeyboardAvoidingView` behaves on both platforms.

**A9. Reading the clipboard needs a native module.** `expo-clipboard` is not
installed, and installing it means rebuilding both development builds — roughly
twelve minutes on Android on this machine. The decision is deferred to Milestone
6, which spells out a fallback that needs no rebuild.


## Open Questions

Q1 to Q4 were answered by the repo owner on 2026-08-20 and are recorded as D-Q1
to D-Q4 in the Decision Log below. One question has been raised since.

Q5, raised in Milestone 2, was answered on 2026-08-20 and is recorded as D-Q5
below.

None outstanding. Q6, raised in Milestone 5, was answered the same day and is
recorded as D-Q6 below.

Raise new questions here as implementation uncovers them, tagged with the
section they affect, and pair each with a Decision Log placeholder.


## Progress

Approved by the repo owner on 2026-08-20 together with the answers to Q1–Q4.

- [x] (2026-08-19 21:04Z) Plan written; Q1–Q4 raised.
- [x] (2026-08-20 09:01Z) Q1–Q4 answered, Decision Log updated, plan approved.
      Implementation started.
- [x] (2026-08-20 09:14Z) Milestone 1 — events, `events.list_id`, `src/lib/`, a bigger
      seed. Nine event types, `events.list_id` and `lists.archived_reason` with
      migration `0002_sudden_vapor.sql`, ten new reads, four helper modules,
      nine seeded lists, and `/db` printing the log as sentences. Verified on
      the booted iPhone 17 and on the Android emulator; `npx tsc --noEmit`
      clean. Automatic archiving is deliberately **not** here — it belongs to
      Milestone 8 with the archive screen.
- [x] (2026-08-20 09:26Z) Milestone 2 — the lists index (`35`) and the list detail
      (`07`, `39`, `15`). Both screens read from the database, checking an item
      works, `SectionLabel` gained an icon and a right slot, `CheckboxRow` gained
      a right slot and now dims as a whole, `Screen` gained a `surface` option,
      the native header is themed, and the `07` vs `39` row is in
      `docs/DESIGN.md`. Verified in both themes on the iPhone 17 and on the
      Android emulator. Deferred on purpose, because neither has anywhere to go
      yet: "Nowa" (Milestone 5), "Pokaż ›" (Milestone 8) and the quick-add bar
      (Milestone 3). One question raised — Q5 below.
- [x] (2026-08-20 09:49Z) Milestone 3 — quick-add: the input bar, the parser, the draft
      row, chips. `src/lib/parseItem.ts`, the bar and the draft row on the list
      screen, suggestions from `frequentItemNames`, "Gotowe" in the header while
      typing, and `Screen` gained a `footer` slot. The keyboard spike changed
      the approach — see Surprises. Verified on both platforms, the iOS lift
      confirmed by the repo owner. "Wklej listę" is left out until Milestone 6,
      which is where it leads.
- [x] (2026-08-20 18:09Z) Milestone 4 — the item sheet (`28`), plus `TextField` and
      `Stepper`. Holding a row opens the sheet; the name, quantity and note are
      editable behind a "Zapisz" that only lights up when something changed, and
      "Usuń" soft-deletes behind an `Alert`. Note chips come from
      `frequentNotesFor` and hide themselves when there are none. Both new
      primitives are in `/gallery`. Verified on both platforms and in both
      themes; the Android detent needed measuring twice, see Surprises.
- [x] (2026-08-20 18:19Z) Milestone 4, follow-up: the stepper and the note field were not
      the same height (40 pt against 47) where `28` draws them as one row. Both
      now take `controlHeight`, a new token measured from that mockup.
- [x] (2026-08-20 18:25Z) Milestone 4, follow-up: a single-line `TextField` no longer
      passes its line height into the input, which is what kept iOS from
      centring the text while Android centred it. Both platforms measured
      afterwards.
- [x] (2026-08-20 18:31Z) Milestone 4, follow-up: the stepper's tile is press feedback now,
      not a standing style — see the Decision Log and `docs/DESIGN.md`.
- [x] (2026-08-20 18:47Z) Milestone 4, follow-up: list rows now check off on tap, open the
      sheet on hold, and take a sideways drag for both. Needed
      `GestureHandlerRootView` at the root — nothing in the app had used a
      gesture before — and a new `SwipeRow` primitive. Verified on both
      platforms: mid-drag the panel shows, on release the item moves or goes.
- [x] (2026-08-20 19:06Z) Milestone 4, follow-up: two new icons — `trash` and
      `arrow-counterclockwise` — drawn in the set's convention and checked in
      `/gallery`, and the restore panel moved from muted to `accent`. Panels
      measured mid-drag on Android: `danger` with the bin, `accent` (80, 90,
      200) with the arrow.
- [x] (2026-08-20 19:30Z) Milestone 4, follow-up: a review pass over the milestone. Six
      findings fixed — the lost travel animation, the item sheet seeding once
      instead of per item, the sheet outliving a soft delete, an unbounded
      drag, a zero threshold before layout, and comments and plan prose left
      describing a tap where the code now wants a hold. A seventh, a press
      scale sticking through a drag, was measured and does not reproduce.
- [x] (2026-08-21 18:00Z) **M4b interrupted this plan.** The app now speaks
      Polish and English, every user-visible string lives in `messages/pl.json`
      and `messages/en.json`, and `src/lib/plural.ts` is gone — CLDR plural keys
      replace it. See `docs/exec-plans/completed/20260820-2147-m4b-bilingual-ui.md`.
      Milestones 5 to 8 of this plan write their copy into both message files as
      they go; where the text below still says `plural(...)`, the note beside it
      says what to use instead.
- [x] (2026-08-21 20:00Z) Milestone 5 — creating, renaming, pinning; `05` wired
      up. Three sheet routes (`new-list`, `list/[id]/rename`, `list/[id]/menu`),
      the shared `src/components/TitleSheet.tsx` behind the first two, "Nowa" in
      the `35` header, the "..." in the list header, and `listToCopy` for the
      `copyFrom` the archive will use in Milestone 8. `ListRow` gained a `tone`
      for the destructive row. Verified on both platforms in both languages.
- [x] (2026-08-22 11:25Z) Milestone 5, follow-ups: holding a card on `35` opens
      that list's menu, and "PRZYPIĘTA" became a counted key — both asked for by
      the repo owner. Checked on the iPhone 17 with two pinned lists reading
      "PRZYPIĘTE" and one reading "PRZYPIĘTA".
- [x] (2026-08-22 12:00Z) Milestone 6 — paste a whole list (`19`). The modal at
      `src/app/list/[id]/paste.tsx`, "Wklej listę" inside the quick-add pill
      where `15` draws it, `fontFamily.mono` per D-Q4, and `CheckboxRow` gained
      a `select` variant because a tick there means "going in", not "bought".
      No clipboard read and no new native module — see the Decision Log.
- [x] (2026-08-22 12:00Z) Milestone 6, follow-up: "i N dalszych pozycji" opens
      the rest of the rows. Asked for by the repo owner, and correctly — see the
      Decision Log.
- [x] (2026-08-22 13:40Z) Milestone 6, follow-up: two defects the repo owner
      found on the paste screen — a checkbox blinking on every keystroke, and
      unticked rows re-ticking themselves after an edit. One cause, see
      Surprises.
- [x] (2026-08-22 14:20Z) Milestone 7 — change history with restore (`25`).
      `src/app/list/[id]/history.tsx`, reached from the "..." menu, which gained
      its "Historia zmian" row. Restoring appends the inverse event and leaves
      the row you pressed where it was, which is the log showing its own shape.
      The `25` vs `35` disagreement is now in the defects table.
- [ ] Milestone 8 — the archive (`41`) and automatic archiving.
- [ ] Documentation: `docs/ROADMAP.md`, `docs/DESIGN.md`, `AGENTS.md`, `README.md`.
- [ ] Both themes checked on both platforms; `npx tsc --noEmit` clean; 8081 free.


## Surprises & Discoveries

- Observation: the exhaustiveness guard now bites in three places, not one.
  Adding a tenth event type without handling it failed the type check in the
  reducer, in the new `listIdOf`, and in `describe` — so a half-added event
  cannot reach a screen as a blank row either.
  Evidence: a temporary `'list.frozen'` entry in `EventPayloads` produced

      src/db/apply.ts(273,10): error TS2322: Type '{ … type: "list.frozen" … }'
        is not assignable to type 'never'.
      src/db/apply.ts(315,10): error TS2322: …
      src/lib/eventText.ts(235,10): error TS2322: …

  and removing it returned `npx tsc --noEmit` to exit 0.

- Observation: "Biedronka, sobota" does not read "Ty utworzył(-a) listę i
  dodał(-a) 8 pozycji" the way mockup 25 does, and that is correct. The burst
  merge only fires when the creator's own additions sit directly next to the
  creation, and in that list Kuba adds "Mleko owsiane" between Ala's creation
  and her own two items. The three lists seeded as one sitting do merge — the
  log shows "09:20 · Nina utworzył(-a) listę i dodał(-a) 4 pozycje".
  Evidence: the /db event log after "Reset and seed", on both platforms.

- Observation: after a schema change, terminate and relaunch the app rather
  than trusting Fast Refresh. Migrations run once at startup from
  `useDatabase`, so a process that is already up keeps the old schema and the
  old bundle; the first `/db` visit still showed `12:41 · item.checked` from the
  previous build.
  Evidence: `xcrun simctl terminate … && xcrun simctl launch …` dropped the
  render counter to 2 and the new columns appeared.

- Observation: on Android, deep-linking `peeers://db` while the development
  client is not connected to a dev server opens the client's own launcher
  instead of the app. Tap the entry under "RECENTLY OPENED" first, then send the
  deep link. Costs about twelve seconds.
  Evidence: two `adb shell am start -a android.intent.action.VIEW` calls, the
  first landing on the "DEVELOPMENT SERVERS" screen.

- Observation: a layout animation has to sit on the node the list keys, not on
  something inside it. `CheckboxRow` has carried `LinearTransition` since M1 so
  that checking an item makes the row travel to ODHACZONE instead of
  teleporting. Wrapping it in `SwipeRow` silently killed that: the wrapper is
  what the list maps over and what moves, and the row inside it never changes
  position relative to the wrapper, so there was nothing for the transition to
  animate. `FadeOut` went the same way — the parent unmounted immediately and
  took the exiting child with it. Found by a review pass, not by looking at the
  screen, which is the point: the app looked fine, it had just stopped moving.

- Observation: an explicit `lineHeight` stops iOS centring a single line in a
  text input. Both platforms centre one line inside a fixed height on their own,
  but the type scale carries a `lineHeight`, and passing it through made iOS lay
  the glyphs along the bottom of the line box while Android still looked right —
  the repo owner spotted the two platforms disagreeing. A single-line `TextField`
  now drops the line height and keeps the rest of the type step.
  Evidence, measured inside the 44 pt field:

      iOS, with lineHeight     ink 59 px from the top, 32 from the bottom
      iOS, without             ink 33 px from the top, 33 from the bottom
      Android, without         ink 41 px from the top, 36 from the bottom

  Android also needed `includeFontPadding: false`, or the room it leaves for
  accents makes the field taller than the stepper beside it.

- Observation: mockup pixels can be measured here after all. This machine has
  no image library, but a throwaway virtualenv in the scratchpad with Pillow in
  it reads them in seconds, which turns "it looks a step small" into a number.
  The stepper and the field were the first use: the repo owner spotted that they
  did not match, and the drawing says the stepper is 88 px tall at 2x and the
  field 82 — so both take 44 pt, now `controlHeight` in `src/theme/tokens.ts`.
  Measuring the rendered screen the same way confirmed it.
  Evidence:

      mockup 28   stepper  y 1306..1393  h=88 px = 44.0 pt
                  field    y 1306..1387  h=82 px = 41.0 pt
      rendered    stepper  y 1046..1177  h=132 px = 44.0 pt
                  field    y 1046..1177  h=132 px = 44.0 pt

  Worth remembering for the milestones still to come, and worth re-checking Q5
  against — that question was answered partly because I said I could not
  measure it.

- Observation: a fixed detent has to hold the *tallest* version of a sheet,
  not the drawn one. `28`'s own proportion is 388 pt of the 874 pt screen —
  0.44 — and at that height Android clipped the footer, because its text runs
  taller, the note chips add a row the mockup does not always have, and the
  navigation bar takes a slice off the bottom. 0.56 clears all three, at the
  cost of some empty space when there are no chips. The sheet also needed its
  own `insets.bottom`: Android draws the navigation bar over it, while iOS
  insets the whole sheet already.
  Evidence: two Android screenshots of the same sheet, footer cut off at 0.46
  and fully visible at 0.56.

- Observation: adding a route file needs a full relaunch of the app, not just a
  save. Fast Refresh does not make expo-router notice a new file, so the first
  tap on a row went to the old code and toggled the item instead of opening the
  sheet. Milestones 5 to 8 all add routes; terminate and launch after each one.

- Observation (the Milestone 3 spike): `KeyboardAvoidingView` does not lift
  the quick-add bar on Android. Measured on API 37 with `behavior` unset and
  again with `behavior='padding'`: in both, the keyboard opened over the bar and
  the bar stayed where it was. The cause is that this app draws edge to edge, so
  the window no longer resizes itself for the keyboard the way `adjustResize`
  used to — the fixes people reach for are a native rebuild
  (`softwareKeyboardLayoutMode: 'pan'`) or a new native module
  (`react-native-keyboard-controller`), and neither is needed here.
  `useAnimatedKeyboard` from `react-native-reanimated`, which is already
  installed, reports the keyboard's height directly; an animated `paddingBottom`
  of `keyboard.height - insets.bottom` lifts the bar exactly onto the keyboard.
  One code path, both platforms, no rebuild.
  Evidence: three Android screenshots in the scratchpad — bar hidden, bar
  hidden, bar sitting on the keyboard.

- Observation: the same code path is right on iOS. It could not be watched
  from here — the simulator has a hardware keyboard attached, so focusing the
  field raises no software keyboard and the lift is correctly zero — and the
  repo owner confirmed it with the software keyboard up: the bar sits on the
  keyboard, not behind it. So `useAnimatedKeyboard` covers both platforms and
  `KeyboardAvoidingView` is not used anywhere in this app.

- Observation: the pushed header stayed white in the dark theme. Nothing in
  the app had ever shown a native header in dark before, and expo-router's Stack
  falls back to React Navigation's own light theme unless told otherwise. Fixed
  in `src/app/_layout.tsx` with `headerStyle`, `headerTintColor` and
  `headerShadowVisible: false`, which is also what `07` and `39` draw — header
  and screen as one surface, no divider.
  Evidence: the dark screenshot of `/list/<id>` before the change, white bar
  above a `#14161B` screen.

- Observation: the list detail screen is `surface`, not `background`. `07` and
  `15` are white edge to edge, unlike `35`, where cards sit on the app
  background. `Screen` had no way to say that, so it gained a `surface` prop.
  Evidence: `assets/design/07-lista-zakupow.png` — the rows sit on the same
  white as the header.

- Observation: on Android the back button is an arrow with no label.
  `headerBackTitle` is iOS-only. Not worth working around: every mockup is iOS
  and `docs/DESIGN.md` already says an Android-specific choice is a judgement
  call.

- Observation: two stray taps of mine on the `/db` check screen unchecked and
  rechecked "Masło", which then showed as "Ty" instead of "Kuba" on `07`. The
  data was right and the screen was right — the log said "11:12 · Ty
  odznaczył(-a) Masło" and "11:12 · Ty odhaczył(-a) Masło" in as many words,
  which is exactly what an append-only log is for. "Reset and seed" restored it.
  Evidence: `sqlite3` against the simulator's `peeers.db` showed
  `Masło|<Ala's id>` and two extra events timestamped inside the minute I was
  tapping.

Two more things are worth watching for because they have bitten this repo
before:

- Editing `metro.config.js` needs a restart with `--clear`; Metro does not reload
  its own config (`docs/DESIGN.md`).
- A schema edit without `npm run db:generate` does nothing at all, because the
  app applies generated migrations at startup (`AGENTS.md`).


- Observation: a sheet can replace itself. `router.replace` from inside a
  presented `formSheet` swaps the screen without dismissing and re-presenting,
  so "Co tworzymy" → "NOWA LISTA" and the "..." menu → "ZMIEŃ NAZWĘ" are both
  one sheet that changes its contents. No stacking, no detents fighting, and the
  first of the two dismissal strategies the plan offered was the one that
  worked. **M5 needs the same trick for "Notatka".**
  Evidence: verified on the iPhone 17 — the "Co tworzymy" sheet is replaced in
  place by the naming sheet at the naming sheet's own detent.

- Observation: the sheets were padded twice at the bottom on iOS, and the
  comment in `src/app/item/[id].tsx` explaining why they were not was wrong. It
  said "iOS insets the whole sheet already, so this only ever adds where it is
  needed" — but `insets.bottom` inside a `formSheet` still reports the home
  indicator's 34 pt, against a `spacing.lg` of 16, so `Math.max` added 18 pt of
  dead space under the last row of every sheet. The "Co tworzymy" sheet of `05`
  never had the problem because it uses a plain `spacing.lg`. All three now take
  the inset on Android only, where the navigation bar really is drawn over the
  sheet.

- Observation: one list unpinned itself during Milestone 5's verification and
  the cause was never established. It happened inside the same second as a
  synthesised long press on that card, which is why it first looked like the
  long press misfiring — a lift landing on the sheet as it slid up. That
  hypothesis did not survive testing: three more long presses, held 700 ms,
  900 ms and 1400 ms, each opened the menu with nothing triggered and the list
  untouched. The repo owner was using the same simulator around that time and
  had pinned both lists by hand minutes earlier, so the likeliest reading is
  simply that they unpinned one. Recorded rather than explained away; if a hold
  on a card is ever seen to fire a menu row on its own, this is the first
  sighting.

- Observation: the development client's floating button sits exactly where `35`
  puts "Nowa", and on Android it covers part of the header. It is draggable —
  hold and drag it somewhere else — and it does not exist in a release build.
  Worth knowing before mistaking it for a layout collision.

- Observation: `CheckboxRow` could not be used as it stood. Its `checked` state
  means *bought* — the row dims to 0.55 and the title is struck through — which
  on `19` said the opposite of the truth: the ticked rows are the ones about to
  be added. The fix is a `variant`, `done` against `select`, rather than a new
  row: the box, its spring, the tick and the layout are all wanted, and only the
  two lines that express "spent" are not.

- Observation: two defects on the paste screen turned out to be one mistake
  about what identifies a parsed row.

  Rows were keyed by name — `` key={`${item.name}-${index}`} `` — so every
  keystroke in a line changed that row's key, React unmounted and remounted it,
  and `CheckboxRow`'s `FadeIn` replayed. That is the blink. And `onChangeText`
  cleared the whole selection, on the reasoning that re-parsing renumbers the
  rows, so one typed character undid every tick the person had set.

  Both go away by identifying a row by the **line of text it came from** rather
  than by what that line currently says. The line number survives editing, so
  the key is stable, the row is never remounted, and the selection can be stored
  against it and left alone. `parsed` now carries `{ line, item }`, and the
  expansion state stops resetting for the same reason the ticks do.

  What remains is inserting a line in the middle, which shifts the numbering
  below it and moves those ticks with the wrong rows. That is inherent to
  positional identity, and it is a far rarer edit than fixing a word.

- Observation: a native header with actions on both sides needs
  `headerTitleAlign: 'center'` to survive Android. iOS centres a header title on
  its own; Android's left-aligns it, which parked "Paste a list" hard against
  "Cancel" with no gap at all — the two read as one word. `19` centres it, so
  the option is set for both platforms rather than only for Android. This is
  the first screen in the app with a native header carrying a left action; the
  pushed detail screens only have a back button and a right action.

- Observation: neither of the two ways this session can put text on the
  simulator carries anything outside ASCII, which made a paste look broken when
  it was not. `xcrun simctl pbcopy` delivered "chleb Ňľytni" and "masŇāo extra"
  for "chleb żytni" and "masło extra" — UTF-8 bytes read as a single-byte code
  page — and the panel's own `text` action reports "unsupported characters
  dropped" for anything non-ASCII. The mangled text corrected itself the moment
  the field's contents round-tripped through a keystroke, and the items landed
  on the list with their Polish intact, so the app is not implicated. It is
  worth one paste by hand to close the question properly, because the alternative
  reading — a multiline `TextInput` handing JS a mis-decoded paste — cannot be
  ruled out from here.

- Observation: the timestamp column of `25` is `caption`, not `bodySmall`, and
  its width cannot be taken from the drawing at all.

  The size is settled by two independent measurements of the mockup: the digits
  are 8 pt tall against the sentence's 10 pt cap height — a ratio of 0.8, which
  is 12/16 and not 15/16 — and 12 px is the size at which "12:41" comes out the
  30 pt wide it is drawn. In `bodySmall` the clock breaks across two lines,
  "14:0" over "6".

  The width is a different matter. `25` draws the time in a monospace-looking
  face where "12:41" is 30 pt; Public Sans with `tabular-nums` measures 33.7 pt
  of ink for the same string on the device, and wants a little more for its side
  bearings — a 36 pt column still truncated to "14:…". The column is 40, which
  puts the avatars 3.5 pt right of where `25` has them. Measuring the drawing
  was necessary and not sufficient; the rendered text had to be measured too.

## Decision Log

The first five entries are the repo owner's answers to Q1–Q5. The rest were
taken while writing the plan, before any code was written.

- Decision (D-Q5): The card titles on `35` stay `bodyMedium`. No new step in the
  type scale.
  Rationale: the repo owner compared the rendered screen against
  `assets/design/35-spis-list.png` and read the difference as within the
  drawing, not a distinct size. Adding a scale step for one screen would put a
  value in `tokens.ts` that nothing else in the app can justify.
  Date/Author: 2026-08-20, repo owner.

- Decision (D-Q1): A list archives itself the moment its last unchecked item is
  ticked, with `reason: 'completed'`.
  Rationale: the literal reading of both `docs/PROJECT.md` ("Once everything is
  checked off, the list moves to the archive") and `35` ("Zamknięte listy
  schodzą tu po odhaczeniu wszystkiego"). It invents no UI: the detail screen
  you are standing on does not change, only its counter reaching "N z N", and
  unchecking anything appends `list.unarchived` and brings the list straight
  back. The check lives in `checkItem` in `src/db/actions.ts`, not in the
  reducer, because `applyEvent` must never depend on what this device already
  knows.
  Date/Author: 2026-08-20, repo owner.

- Decision: "i N dalszych pozycji" on `19` is a button that opens the rest of
  the parsed rows, drawn in accent rather than the drawing's muted grey.
  Rationale: raised by the repo owner, and it is a real gap rather than a
  refinement. `19` lists four rows and counts the rest, which is right for
  reading and wrong for choosing: the button underneath offers to add all six,
  and everything past the fourth was going in with no way to say otherwise. The
  count now opens them. The colour changes with the behaviour — the drawing has
  that line doing nothing, and a line that opens the rest of a list has to say
  it does; accent is how every other tappable label in this app reads. Opening
  is one-way: nothing in `19` names a way back, and a modal that is about to be
  dismissed does not need one.
  Date/Author: 2026-08-22, repo owner.

- Decision: Milestone 6 does not read the clipboard, and `expo-clipboard` is
  not installed.
  Rationale: the plan set this up as a question for the repo owner because the
  package is native and costs a rebuild of both development builds. The screen
  was built on the fallback first — an empty, focused, multiline field that the
  person pastes into with the system menu — and the fallback turned out to cost
  one long press and one tap, produce no "Allow Paste?" prompt on iOS 16 and
  later, and leave the text editable so a bad paste is fixed rather than
  restarted. Auto-filling would save that one gesture. The owner can still ask
  for it; nothing else about the screen would change.
  Date/Author: 2026-08-22, Claude (implementing).

- Decision (D-Q6): "PRZYPIĘTA" becomes a counted key, reading "PRZYPIĘTE" from
  two lists up. Pinning stays unlimited.
  Rationale: `35` draws one pinned list and its label agrees with one feminine
  *lista*; nothing stops a second, and Milestone 5 made pinning easy enough that
  it happens. Of the three ways out — a counted label, capping the section at one
  list, or leaving the grammar wrong — the repo owner took the first. It is also
  the smallest: the message files already hold four counted keys, and the label
  never prints the number, so the count is there only to pick the form. English
  has one word either way and needs `_one` and `_other` holding the same string,
  which is what makes the key resolve at all.
  Date/Author: 2026-08-22, repo owner.

- Decision: `pull-down` is the icon for "Schowaj do archiwum", not the `basket`
  the plan suggested.
  Rationale: the plan left the choice open among the 24 existing icons. `basket`
  is the Zakupy tab's own glyph, so using it for the archive would have one
  drawing mean two things — and "put the list in the shopping basket" is
  backwards for putting it away. `pull-down` is an arrow with a shaft pointing
  down: move it down, out of the way.
  Date/Author: 2026-08-21, Claude (implementing).

- Decision: the two naming sheets share `src/components/TitleSheet.tsx` rather
  than being two independent files.
  Rationale: the plan calls them "the same shape" and they are — a heading, one
  underlined field, a primary action and "Anuluj". Two copies would drift. It
  sits in `src/components/` beside `TabBar`, not in `components/ui/` which is
  the design system, and not in `src/app/` where every file is a route.
  M5's "Notatka" naming step is the third caller.
  Date/Author: 2026-08-21, Claude (implementing).

- Decision: `ListRow` gained a `tone` prop, used for "Usuń listę".
  Rationale: the destructive row of a menu has to read as destructive, and
  `Text` already had the tone vocabulary. M9's "Usuń osobę" and "Opuść
  Przestrzeń" want the same thing. It is the fourth primitive this plan has
  extended rather than worked around, after `SectionLabel`, `CheckboxRow` and
  `Screen`.
  Date/Author: 2026-08-21, Claude (implementing).

- Decision: deleting a list is confirmed with an `Alert`, which the plan does
  not specify, and the list screen pops itself rather than the sheet popping it.
  Rationale: the confirmation matches what deleting an item already does in
  Milestone 4, and losing a whole list to a mis-tap is worse. The dismissal is
  split because each screen then owns its own exit: the menu closes itself, and
  the list screen leaves when its row gains a `deleted_at` — which also covers
  the M8 case of somebody else deleting it while you are looking at it. That is
  the same pattern `src/app/item/[id].tsx` uses.
  Date/Author: 2026-08-21, Claude (implementing).

- Decision: holding a card on `35` opens that list's "..." menu.
  Rationale: asked for by the repo owner at the end of Milestone 5. It is the
  gesture pair the item rows already use — a tap for the thing you do every
  time, a hold for the sheet — and it saves opening a list only to reach for the
  "..." in its header. No mockup draws it, like the menu itself (D-Q2).
  Date/Author: 2026-08-21, repo owner.

- Decision (D-Q2): The list detail header gets a "..." action in the slot `07`
  gives to "Udostępnij", opening a sheet with "Zmień nazwę", "Przypnij do góry"
  / "Odepnij", "Historia zmian", "Schowaj do archiwum" and "Usuń listę".
  Rationale: `25`, `35`'s pinned section and `41`'s manually hidden lists all
  exist, and no mockup draws a way into any of them. Both halves of this are
  already established in the app — `41` uses a three-dot affordance, and M2
  settled that sheets are routes — so nothing new is invented, and the same
  sheet then serves the archive rows with a different set of actions.
  Date/Author: 2026-08-20, repo owner.

- Decision (D-Q3): A new list is named in a small sheet before it exists, and
  the same sheet does the rename and the "Skopiuj pozycje na nową listę" of
  `41`.
  Rationale: `05` and `35`'s "Nowa" both need a next step that no mockup draws,
  and `15` shows a list that already has a name. Creating the list unnamed and
  editing the title in place would invent an editing affordance that appears
  nowhere; one sheet with one field invents the least.
  Date/Author: 2026-08-20, repo owner.

- Decision (D-Q4): Add one token, `fontFamily.mono`, resolved per platform, and
  use it **only** for the pasted-text block on `19`.
  Rationale: three mockups use a monospace face, but only on `19` is it carrying
  meaning — that block is raw text the person pasted, not app copy. `08`'s
  "częste u Was" caption and `25`'s timestamp column stay in Public Sans, the
  latter with `fontVariant: ['tabular-nums']` so the digits still line up.
  Bundling a whole mono font for two captions is not worth the app size, so the
  token resolves to the platform's own: `Menlo` on iOS, `monospace` on Android.
  Date/Author: 2026-08-20, repo owner.

- Decision: Rejected the review finding that the press scale sticks through a
  sideways drag.
  Rationale: the concern is sound in shape — `Pressable`'s `onPressIn` fires on
  touch-down, before the pan clears its 12 px activation offset — but gesture
  handler cancels the touch in the views under it when a gesture activates, and
  a cancelled press runs `onPressOut` like a lifted one. Measured rather than
  argued: the rendered width of a row's text is identical before a short drag
  and after it, to the pixel. A row left at 0.97 would be about 27 px narrower.
  Date/Author: 2026-08-20, Claude.

- Decision: A list row answers to a tap, a hold and a sideways drag. Tap checks
  the item off, hold opens the sheet of `28`, drag right checks off or puts a
  checked item back, drag left removes.
  Rationale: the repo owner's call, and it fixes a real fault — with the sheet on
  tap, the commonest action in the app could only be reached by hitting a 26 pt
  circle. The frequent thing now takes the careless gesture and the rare one
  takes the deliberate gesture. The drags are an addition on top of the mockups,
  which draw none of them; they are built from the tokens the app already has,
  a coloured panel with one icon, and fire on release past a third of the width.
  Two icons had to be drawn for them, `trash` and `arrow-counterclockwise`,
  since the set had neither; the restore panel is `accent` rather than muted,
  because putting something back is an action and not an absence of one.
  Two things to know about the delete drag: it does not ask, because a
  confirmation after every swipe defeats the gesture, and until Milestone 7
  ships the change history there is no way back to a removed item from the UI —
  the row is soft-deleted and still in the database either way. Recorded in
  `docs/DESIGN.md` under Motion, since no drawing explains where the gestures
  came from.
  Date/Author: 2026-08-20, repo owner.

- Decision: The light tile behind the stepper's plus on `28` becomes press
  feedback rather than a standing style, on both signs.
  Rationale: the repo owner's call. `28` draws the tile at rest, which spends the
  one visual accent this control has on labelling the plus; a 36 pt button is
  better served by saying it was hit. Measured on Android: the button reads
  `tileFill` at rest and `surface` while held. Recorded in `docs/DESIGN.md`
  under Motion so that nobody later "fixes" it back to the drawing.
  Date/Author: 2026-08-20, repo owner.

- Decision: The `events` table gains a nullable, indexed `list_id` column, set by
  the reducer from the payload.
  Rationale: `35` needs the newest event per list and `25` needs every event for
  one list. The list id lives inside `payload`, which is a JSON string, and
  digging it out needs `json_extract` — raw SQL, which `useLiveQuery` refuses
  outright (`node_modules/drizzle-orm/expo-sqlite/query.js` sets an error for
  `SQL` and `Subquery` sources). A derived column keeps both reads on one plain
  table. It is local-only in the same way `synced_at` already is: M8 pushes the
  six canonical columns and recomputes `list_id` when it applies a pulled event,
  because `applyEvent` is the only writer either way.
  Date/Author: 2026-08-19, Claude.

- Decision: Where `07` and `39` contradict each other, follow `07`, and record
  the contradiction in `docs/DESIGN.md`.
  Rationale: they differ on the order of the item subtitle (`07`: "×2 · Kuba",
  "duża paczka · Nina"; `39`: "Kuba · x2", "Kuba · duża paczka") and on what a
  checked row shows on the right (`07`: the name of whoever checked it; `39`:
  the name and a time). `07` is the light-theme primary and agrees with `28`,
  which puts "Dodał(-a) Nina · dziś 11:07" in its own footer rather than in the
  row. Following `39` would also make the checked rows the widest text on the
  screen.
  Date/Author: 2026-08-19, Claude.

- Decision: The current person is written as "Ty" followed by the same verb form
  used for everyone else — "Ty odhaczył(-a) chleb", not "Ty odhaczył(-a)ś".
  Rationale: `25` and `35` disagree; `25` uses the third-person form after "Ty"
  four times, `35` uses the second-person "-ś" once. Following `25` means one
  table of verb forms serves both cases, and one fewer string to get wrong in
  every future event type. Recorded in `docs/DESIGN.md` as a mockup defect.
  Date/Author: 2026-08-19, Claude.

- Decision: Polish grammar helpers live in a new `src/lib/`, not in `src/db/`.
  Rationale: `src/db/` is the data layer and holds no user-visible copy; putting
  "dopisał(-a)" there would mix the two. `src/lib/` is described as pure helpers
  with no React and no database, matching how `src/theme/` is "values only, no
  React". `AGENTS.md` and `README.md` gain a row for it.
  Date/Author: 2026-08-19, Claude.

- Decision: Suggestion chips are a one-shot read, not a live query.
  Rationale: "most used names in this Przestrzeń" spans `list_items` and `lists`,
  and `useLiveQuery` only re-runs on changes to the single table a query selects
  from. Suggestions are a snapshot taken when the input is focused; nobody needs
  them to change under their thumb mid-word. The Drizzle Expo driver is
  synchronous, so this is an ordinary function call returning rows, not a
  promise.
  Date/Author: 2026-08-19, Claude.

- Decision: The seed gets the five archived lists that `41` names, not eight.
  Rationale: `41`'s header reads "8 list" and `35` reads "ARCHIWUM · 8", but the
  screen only names five. Both counters are computed from the database, so they
  will read 5 and the screens stay internally consistent. Inventing three list
  names to hit a number in a drawing is worse than a counter reading 5.
  Date/Author: 2026-08-19, Claude.

- Decision: A list at 0 checked shows an empty progress track.
  Rationale: `35` draws a small accent nub on "Drogeria 0 z 4". `ProgressBar`
  clamps to `0`, which renders nothing. A minimum visible fill would state that
  progress exists when it does not. If the owner reads the nub as intentional,
  it is a one-line change in `src/components/ui/ProgressBar.tsx`.
  Date/Author: 2026-08-19, Claude.

- Decision: Confirmations use React Native's `Alert`, not a new component.
  Rationale: the only confirmation dialog in the mockups is `21`, which belongs
  to M9 and is drawn as a stock iOS alert. `Alert.alert` renders exactly that on
  iOS and a Material dialog on Android, and it costs nothing. Destructive
  actions in this milestone — "Usuń" on `28`, "Usuń na zawsze" and "Wyczyść" on
  `41` — go through it.
  Date/Author: 2026-08-19, Claude.


## Outcomes & Retrospective

To be written at the end of the milestone. It must answer: does the loop
described under "Purpose" work end to end on both platforms in both themes;
which of D-Q1 to D-Q4 changed the shape of the work; what M5, M6 and M8 inherit from
`src/lib/` and the new event types; and what was left undone.


## Context and Orientation

Read this section even if you think you know the repository. It assumes nothing.

### What Peeers is

A Polish app for people who share a flat: shopping lists and notes inside a
shared **Przestrzeń** (a "space" — the container for lists, notes and people).
Expo SDK 57, expo-router, TypeScript, iOS and Android. The vocabulary is Polish
on purpose and stays Polish in code comments and prose: Przestrzeń, Lista,
Notatka, Członek, Admin. Everything else — documentation, identifiers, comments
— is English. UI strings are Polish and are copied **verbatim** from the mockups
in `assets/design/`, never translated by hand.

### The database, as it stands today

`src/db/` holds the whole data layer, built in M3:

- `client.ts` opens `peeers.db` through `expo-sqlite` with the change listener
  enabled, sets `journal_mode = WAL` and `foreign_keys = ON`, and wraps it in
  Drizzle ORM. The driver is **synchronous**: queries end in `.run()`, `.get()`
  or `.all()` and return immediately. No screen awaits its own data.
- `events.ts` is the event vocabulary — a TypeScript type per event, keyed by a
  dotted name such as `item.added`. An **event** is a statement that someone did
  something at a point in time. Events are appended and never updated or deleted.
- `schema.ts` defines eight tables: `settings`, `spaces`, `people`,
  `space_members`, `lists`, `list_items`, `notes`, `events`. State is held in
  nullable timestamps rather than status columns — a list is pinned when
  `pinned_at` is set, an item is checked when `checked_at` is set, a row is
  deleted when `deleted_at` is set. Deletes are soft everywhere.
- `apply.ts` exports `applyEvent(event)`, the **only** function in the app that
  writes to a materialised table. It inserts the event and applies its effect in
  one transaction. Its `switch` ends in `const unhandled: never = event`, so
  adding an event type without adding a branch fails `npx tsc --noEmit`.
- `actions.ts` has one exported function per thing a person can do. Each builds
  an event and calls `applyEvent`. None of them touches a table directly.
- `queries.ts` returns **unexecuted** Drizzle queries for `useLiveQuery`, and
  every function selects from exactly one table. That is a constraint, not a
  style: `useLiveQuery` compares the changed table's name against the query's own
  source table, so a query that joins goes stale when the joined table changes.
  When a screen needs two tables it runs two live queries and joins them in
  JavaScript.
- `seed.ts` reproduces mockups `03`, `07` and `09` as 20 events, in development
  builds only, and returns immediately if `current_person_id` is already set.
- `index.ts` is the public surface. Screens import from `@/db` and never from the
  files under it.

Reading is `useLiveQuery` from `drizzle-orm/expo-sqlite`:

    const { data: items } = useLiveQuery(itemsInList(listId), [listId])

It costs one render per *tick*, not per write — twenty writes in one synchronous
loop produced a single re-render when M3 measured it.

There is a development-only check screen at `/db`, reachable from the "Ty" tab,
which lists the seeded Przestrzeń, its people, lists, notes and recent events,
and has buttons to add twenty items and to wipe and reseed. It is the fastest
way to see whether a write did what you meant.

### The routes this milestone touches

Full paths, all under `src/app/` (expo-router: the file path *is* the URL):

- `src/app/(tabs)/lists.tsx` — the "Zakupy" tab. Currently a stub. Becomes `35`.
- `src/app/list/[id].tsx` — the list detail. Currently a stub. **Moves** to
  `src/app/list/[id]/index.tsx` so that `history.tsx`, `paste.tsx`, `menu.tsx`
  and `rename.tsx` can live beside it. Becomes `07` / `39` / `15`.
- `src/app/new.tsx` — the "Co tworzymy" sheet from `05`. Both of its options
  currently call `router.back()`. The "Lista zakupów" option starts creating a
  list; "Notatka" stays as it is, because M5 owns notes.
- `src/app/_layout.tsx` — the root stack. Detail screens are registered here,
  not inside the tabs, because `07` has no tab bar and a list is reachable from
  both the feed and the Zakupy tab.
- `src/app/db.tsx` — the check screen. Its event log starts rendering sentences.

New route files are listed under "Routes — after" in the Bird's Eye View.

Two facts about this navigator that matter:

- **Bottom sheets are routes, not components.** M2 settled this. A sheet route
  gets `presentation: 'formSheet'` in `src/app/_layout.tsx`, with
  `sheetAllowedDetents: 'fitToContents'` on iOS and an explicit fraction on
  Android, where `fitToContents` measures the content wrapper as 0 and collapses
  the sheet to a bare strip. `sheetCornerRadius` must be set or Android draws
  square corners. `sheetGrabberVisible` is iOS-only. Copy the block that
  `src/app/_layout.tsx` already has for `name='new'`, comments included.
- **Static route segments beat dynamic ones**, but do not rely on it. The
  "Nowa lista" sheet is `src/app/new-list.tsx`, not `src/app/list/new.tsx`,
  precisely so that nobody has to reason about whether `/list/new` resolves to
  the sheet or to a list whose id is the string "new".

### Mockups

Every screen in this milestone, by number, in `assets/design/`:

- `35-spis-list.png` — the index. Header "MIESZKANIE 14 / Listy / Nowa".
  Sections: a pin icon and "PRZYPIĘTA" over one card; "AKTYWNE · 3" over three;
  "ARCHIWUM · 8" with "Pokaż ›" on the right and an info strip under it. Each
  card: title, a counter ("2 z 6"), a progress bar, and an avatar with a
  one-line summary of the last thing that happened ("Kuba dopisał(-a) 3 pozycje
  · 17:05"). Only the pinned card's counter sits in a filled badge; the others
  are plain grey text.
- `07-lista-zakupow.png` — the detail. Back link "‹ Mieszkanie 14", title, and
  "2 z 8 / odhaczone" right-aligned in two lines. "DO KUPIENIA" over six rows,
  "ODHACZONE · 2" over two. Each unchecked row: a hollow circle, the name, a
  grey subtitle, and the author's avatar on the right. Checked rows: a filled
  circle, the name struck through, and the checker's name in grey on the right,
  no avatar. At the bottom, a rounded bar: a round accent "+", the placeholder
  "Dodaj pozycję…", and "Wklej listę" on the right.
- `39-lista-zakupow-ciemna.png` — the same screen in the dark theme. See A4 and
  the Decision Log for the two places it contradicts `07`.
- `15-pusta-lista.png` — the same screen with no items: header counter reads
  "0 pozycji / 3 osoby", the `empty-list` illustration, "Lista jest jeszcze
  pusta", two lines of body copy naming the other people, a "CZĘSTE U WAS" label
  and four chips prefixed with "+", and the input bar reading "Dodaj pierwszą
  pozycję…".
- `08-dopisywanie-pozycji.png` — the same screen while typing. The header right
  action reads "Gotowe". A highlighted draft row sits where the new item will
  land, showing what has been typed and a "dodaj" action. Under it, the hint
  „x2" czytamy jako ilość… and the "CZĘSTE U WAS" chips (here captioned "częste
  u Was" on the same line as the chips). The bottom bar has become a plain field
  with a round accent ↑ button.
- `28-szczegoly-pozycji.png` — the item sheet over a dimmed list. "POZYCJA" with
  "Zapisz" on the right, a "NAZWA" field with an underline, "ILOŚĆ" as a
  − 1 + stepper beside a filled "DOPISEK" field, three chips of suggested notes,
  two lines of explanatory copy, and a footer with the author's avatar,
  "Dodał(-a) Nina · dziś 11:07" and a red "Usuń".
- `19-wklej-liste.png` — a full-screen modal. "Anuluj / Wklej listę / Dodaj",
  a grey block of pasted text in a monospace face, "ROZPOZNANE POZYCJE · 6" with
  "Odznacz wszystkie" on the right, four rows with checkboxes and quantity
  badges, "i 2 dalsze pozycje", a hint, and a full-width primary button "Dodaj 5
  pozycji do listy".
- `25-historia-zmian-listy.png` — pushed from the list. "‹ Biedronka, sobota",
  "Historia zmian", "Ostatnie 30 dni", then rows grouped under "DZIŚ",
  "WCZORAJ", "12 SIERPNIA". Each row: a time in the left gutter, an avatar, a
  sentence with the actor's name in bold, and — on two of them — "Przywróć" on
  the right. One row carries a grey chip listing three item names.
- `41-archiwum-list.png` — "‹ Listy", "Wyczyść", "Archiwum", "8 list /
  Mieszkanie 14", rows grouped by month ("SIERPIEŃ", "LIPIEC"). Each row: a
  green check (or a grey minus for a list hidden manually while unfinished), the
  title, "9 pozycji · zamknięta 12 sierpnia" or "2 z 6 · schowana ręcznie 3
  sierpnia", and "..." on the right. An info strip at the bottom names the three
  actions behind the dots.
- `05-co-tworzymy.png` — the sheet behind the raised "+" in the tab bar. Already
  built; only the "Lista zakupów" option's handler changes.

### Tokens

Everything comes from `useTheme()`, which reads `src/theme/tokens.ts`. Nothing
in this milestone may write a colour, a spacing or a font size as a literal.
What the screens need already exists:

- colours `background`, `surface`, `border`, `accent`, `text`, `textMuted`,
  `danger` (the red "Usuń"), `success` (`41`'s green check, measured from that
  very screen), `selectedSurface` and `selectedBorder` (the highlighted draft
  row on `08` and the pinned card's badge on `35`), `tileFill` (the filled
  fields on `28` and the pasted-text block on `19`),
- `avatarColors` for the eight avatar colours,
- `typography` — `titleLarge` for "Listy"/"Archiwum"/"Historia zmian", `title`,
  `bodyMedium` for item names, `bodySmall` for subtitles, `caption` for the
  smallest grey lines, `label` for the uppercase section headings,
- `spacing`, `radius`, `motion`, `shadow`.

Two things may need a **measured** token, and both must be measured from the
mockup at 2× rather than eyeballed, then added to `tokens.ts` with a comment
naming the screen, exactly as every other value there does:

1. the height and corner radius of the quick-add bar on `07`, if they do not
   fall out of the spacing and radius scales,
2. `fontFamily.mono`, decided in D-Q4: one token resolved per platform —
   `Menlo` on iOS, `monospace` on Android — used only by the pasted-text block
   on `19`. It carries the same kind of source comment as everything else in
   `tokens.ts`, naming that screen.

If a colour is needed that is not in the tokens, measure it; do not pick one.
`docs/DESIGN.md` explains the method, including how the dark theme's values were
derived.

### Scope check

Nothing in this milestone appears under `docs/PROJECT.md` → "Deliberately out of
scope", with one exception that is handled by leaving it out: the "Udostępnij"
action of `07`, `15` and `28`, which A1 covers. Feed posts with replies, link
sharing, moving to a new phone, presence and the per-person access screen are
all untouched.

The milestone also does not widen into its neighbours: no note editing (M5), no
feed (M6), no onboarding or appearance settings (M7), no sync, no invite codes,
no search.

### Known mockup defects

`docs/DESIGN.md` keeps a table of drawings that contradict each other. Three
existing rows matter here:

- `03`, `07`, `20`, `27` vs `35`, `38` — "Biedronka, sobota" is either "2 z 8" or
  "2 z 6". The counter is computed, so whatever the seed contains is what shows.
- `03` vs `35`, `38` — the same "3 items added" event is Nina's at 11:07 in one
  place and Kuba's at 17:05 in another.
- `03` vs `07` — `03`'s feed card names three added items including "worki 60 l",
  which `07` does not contain.

This plan **adds two rows** to that table, in Milestone 2 and Milestone 7
respectively:

- `07` vs `39` — the item subtitle is "×2 · Kuba" in one and "Kuba · x2" in the
  other, and a checked row shows the checker's name in one and the name plus a
  time in the other.
- `25` vs `35` — the current person's own actions read "Ty odhaczył(-a)" in one
  and "Ty odhaczył(-a)ś" in the other.

Do not "fix" code to match a defect.


## Copy that no mockup provides

`AGENTS.md` constraint 3 says UI copy is Polish taken verbatim from the mockups
and never translated by hand. Some strings this milestone needs are simply not
drawn anywhere. They are collected here so the repo owner can approve or replace
them in one pass rather than finding them scattered through a diff. **Do not
invent additional strings beyond this list**; if a screen turns out to need one,
add it here and ask.

Event sentences (`src/lib/eventText.ts`) — the ones `25` does provide are marked
with the mockup they come from:

    list.created      utworzył(-a) listę                          25
    item.added (1)    dopisał(-a) <nazwa>                          —
    item.added (n)    dopisał(-a) 3 pozycje                       25, 35
    created + added   utworzył(-a) listę i dodał(-a) 8 pozycji    25
    item.checked      odhaczył(-a) <nazwa>                        25, 35
    item.unchecked    odznaczył(-a) <nazwa>                        —
    item.removed      usunął(-ęła) pozycję „chipsy"               25
    item.restored     przywrócił(-a) pozycję „chipsy"              —
    item.edited       zmienił(-a) pozycję „chipsy"                 —
    list.renamed      zmienił(-a) nazwę listy na „…"              25
    list.pinned       przypiął(-ęła) listę                         —
    list.unpinned     odpiął(-ęła) listę                           —
    list.archived     zamknął(-ęła) listę            (completed)   —
                      schował(-a) listę do archiwum  (manual)      —
    list.unarchived   przywrócił(-a) listę do aktywnych            —
    list.deleted      usunął(-ęła) listę                           —

Screen copy not drawn anywhere:

    the list "..." sheet        Zmień nazwę · Przypnij do góry · Odepnij ·
                                Historia zmian · Schowaj do archiwum ·
                                Usuń listę · Anuluj
    the archive "..." sheet     Przywróć do aktywnych ·
                                Skopiuj pozycje na nową listę ·
                                Usuń na zawsze · Anuluj          (41's info
                                strip names the first three verbatim)
    the "Nowa lista" sheet      NOWA LISTA · NAZWA · np. Biedronka, sobota ·
                                Utwórz · Anuluj
    the rename sheet            ZMIEŃ NAZWĘ · Zapisz · Anuluj
    item delete confirmation    Usunąć „<nazwa>"? / Pozycję można przywrócić
                                w historii zmian. / Anuluj · Usuń
    delete confirmations        Usunąć listę „…"?  /  Lista zniknie z
                                archiwum. Tej operacji nie da się cofnąć. /
                                Anuluj · Usuń
    clear-archive confirmation  Wyczyścić archiwum? / Usuniemy 5 list. Tej
                                operacji nie da się cofnąć. / Anuluj · Wyczyść
    empty archive               Archiwum jest puste
    empty index                 Nie ma jeszcze żadnej listy

The gendered "(-a)" forms above copy the convention the mockups already use for
every verb, which is how this product avoids storing a person's gender.


## Plan of Work

Eight milestones. Each ends with something you can look at, and each leaves the
app in a state where `npx tsc --noEmit` is clean and nothing that worked before
is broken. Work them in order: 2 needs 1, 3 needs 2, and 7 and 8 need the events
added in 1.

Two standing rules from `AGENTS.md` while you work. **Never run `git commit`,
`git add` or `git push`, and do not create branches.** Leave everything in the
working tree; propose a commit message as text at the end. And **do not start
the iOS Simulator or the Android emulator** — the repo owner has them running.
If nothing is booted, say so and stop.


### Milestone 1 — The events M4 needs, the Polish helpers, and a Przestrzeń worth looking at

This milestone adds no screens. It adds the nine event types the rest of the
milestone will append, the derived column that makes them readable per list, the
pure helpers that turn them into Polish, and a seed with enough lists in it that
`35` and `41` have something to draw. At the end, `/db` shows the event log as
sentences instead of type names.

**Schema.** In `src/db/schema.ts`:

- add `listId: text('list_id')` to `events`, nullable, and an index
  `events_list_created_idx` on `(listId, createdAt)`. Document it in the table's
  comment as a **derived, local-only** column in the same family as
  `synced_at`: M8 pushes the six canonical columns and recomputes it when it
  applies a pulled event, because `applyEvent` is the only writer either way.
- add `archivedReason: text('archived_reason').$type<ArchiveReason>()` to
  `lists`, nullable. Mockup `41` distinguishes "zamknięta 12 sierpnia" from
  "schowana ręcznie 3 sierpnia", and Milestone 8 needs to know which kind of
  archiving to undo automatically.

Then, from the repository root:

    npm run db:generate
    # Expect a new file under src/db/migrations/, e.g. 0002_<two words>.sql,
    # containing ALTER TABLE `events` ADD `list_id` text; and the CREATE INDEX,
    # plus a new entry in meta/_journal.json.

A schema edit without this command does nothing — the app applies generated
migrations at startup, not the schema file.

**Events.** In `src/db/events.ts`, add to `EventPayloads`:

    export type ArchiveReason = 'completed' | 'manual'

    'list.renamed':    { listId: string; title: string }
    'list.pinned':     { listId: string }
    'list.unpinned':   { listId: string }
    'list.archived':   { listId: string; reason: ArchiveReason }
    'list.unarchived': { listId: string }
    'list.deleted':    { listId: string }
    'item.edited':     { itemId: string; listId: string; name: string
                         quantity: number; note: string | null }
    'item.removed':    { itemId: string; listId: string }
    'item.restored':   { itemId: string; listId: string }

Note what is **not** in those payloads: an item's name is not copied into
`item.removed`, even though mockup `25` renders "usunął(-ęła) pozycję
„chipsy"". The M3 rule is that a payload carries what the *reducer* needs, and
the reducer needs only ids. The history screen looks names up from `list_items`,
which still holds the row — deletes are soft. `item.checked` already works this
way.

**The reducer.** In `src/db/apply.ts`:

- add a branch per new type. `list.renamed` sets `title` and `updated_at`;
  `list.pinned` sets `pinned_at` to the event's `createdAt` and `list.unpinned`
  sets it to null; `list.archived` sets `archived_at` and `archived_reason` and
  `list.unarchived` nulls both; `list.deleted` sets `deleted_at`; `item.edited`
  sets name, quantity and note; `item.removed` sets `deleted_at` and
  `item.restored` nulls it. Every one of them also calls the existing
  `touchList` so the index's ordering by `updated_at` stays honest.
- add `listIdOf(event: AppEvent): string | null` and pass its result into the
  `events` insert. Write it as a `switch` over `event.type` ending in the same
  `const unhandled: never = event` guard the reducer uses, so a future event type
  cannot silently get a null `list_id`. The four existing non-list types
  (`space.created`, `person.joined`, `note.created`, `note.edited`) return null.

Prove the guard still bites before moving on: temporarily add a tenth type to
`EventPayloads` without a branch and confirm `npx tsc --noEmit` fails with
`Type '{ … }' is not assignable to type 'never'`, then remove it.

**Actions.** In `src/db/actions.ts`, one function per new event, following the
shape of the existing ones exactly — build the event, call `applyEvent`, return
nothing (or the new id where one is created):

    renameList({ spaceId, listId, title })
    pinList({ spaceId, listId })          unpinList({ spaceId, listId })
    archiveList({ spaceId, listId, reason })
    unarchiveList({ spaceId, listId })    deleteList({ spaceId, listId })
    editItem({ spaceId, listId, itemId, name, quantity, note })
    removeItem({ spaceId, listId, itemId })
    restoreItem({ spaceId, listId, itemId })
    addItems({ spaceId, listId, items })   // items: ParsedItem[]

`addItems` is a plain loop over `addItem`. Each call is its own transaction and
each reads `max(position)` afresh, which is correct because the driver is
synchronous — the second call sees the first one's row. Twenty writes in one
tick cost one re-render, which M3 measured, so there is no reason to batch them
into a single transaction and lose the one-event-per-item log that `25` needs.

**Reads.** In `src/db/queries.ts`, keeping the one-table rule:

    listById(listId)                    // lists
    allItemsInList(listId)              // list_items, deleted rows included
    itemById(itemId)                    // list_items
    itemCountsByList()                  // list_items, grouped
    listActivity(spaceId, limit)        // events, list_id IS NOT NULL, desc
    eventsForList(listId, sinceIso)     // events, desc

`itemCountsByList` is the one aggregate:

    db.select({
        listId:  listItems.listId,
        total:   count(),
        checked: count(listItems.checkedAt),
      })
      .from(listItems)
      .where(isNull(listItems.deletedAt))
      .groupBy(listItems.listId)

`count(column)` counts non-null values, which is exactly "how many are checked".
This is still a single-table select, so `useLiveQuery` subscribes to it happily —
what it refuses is raw SQL and subqueries, and this is neither. If it misbehaves,
the fallback is to select `{ listId, checkedAt }` and count in JavaScript; a
Przestrzeń holds a few hundred item rows at most.

Then a second, clearly separated group at the bottom of the file for **one-shot
reads** — functions that execute immediately and return rows, for data that does
not need to be live. Give the group a comment explaining the distinction, since
everything above it is deliberately unexecuted:

    frequentItemNames(spaceId, excludeListId, limit): string[]
    frequentNotesFor(spaceId, name, limit): string[]

`frequentItemNames` joins `list_items` to `lists` to stay inside the Przestrzeń,
counts by lower-cased name, excludes names already present on the current list,
orders by count then by recency, and takes `limit`. Mockup `41` says in its own
info strip that the archive feeds these suggestions, so do **not** filter
archived lists out. `frequentNotesFor` returns the distinct notes previously used
on items with the same lower-cased name, most recent first — the three chips on
`28`. Both return `[]` when there is nothing, and every caller must hide its chip
row rather than draw an empty one.

**The Polish helpers.** A new directory `src/lib/`, for pure functions with no
React and no database — the same kind of boundary `src/theme/` has. Add the row
to the code-layout tables in `AGENTS.md` and `README.md` in this milestone, not
at the end.

`src/lib/plural.ts` — **deleted by M4b**, and described here only because
Milestone 3 built it and the text below still refers to what it did:

    export function plural(n: number, one: string, few: string, many: string): string

Polish picks `one` for exactly 1, `few` when `n % 10` is 2, 3 or 4 **and**
`n % 100` is not 12, 13 or 14, and `many` otherwise. Callers passed the case they
needed, because the app needs both nominative ("9 pozycji", "22 pozycje" on `41`)
and accusative ("Dodaj 5 pozycji do listy", "Dodaj 2 pozycje do listy" on `19`).
That rule is now CLDR's, supplied by `intl-pluralrules`, and the two cases are
two keys — `list.itemCount` and `activity.items`.

`src/lib/time.ts`, every function taking an ISO-8601 UTC string and an optional
`now` so the behaviour can be checked without waiting a day:

    clockTime(iso)     "12:41"        — through new Date() and the local getters
    shortWhen(iso)     "17:05" | "wczoraj" | "2 dni temu" | "w piątek" | "12 sierpnia"
    whenLong(iso)      "dziś 11:07" | "wczoraj 12:04" | "12 sierpnia 09:15"
    dayHeading(iso)    "DZIŚ" | "WCZORAJ" | "12 SIERPNIA"
    monthHeading(iso)  "SIERPIEŃ"
    dayMonth(iso)      "12 sierpnia"

**Never slice the ISO string.** Timestamps are stored in UTC, which reads two
hours early in Poland; the doc comment on `createdAt` in `src/db/events.ts`
already says so. Everything here goes through `new Date(iso)` and the local
getters.

`shortWhen`'s rule, chosen so that one rule reproduces both of the strings `35`
shows: today → the clock time; yesterday → "wczoraj"; two days → "2 dni temu";
three to six days → the weekday, with the preposition Polish actually uses —
"w poniedziałek", **"we wtorek"**, "w środę", "w czwartek", "w piątek",
"w sobotę", "w niedzielę"; seven days or more → "12 sierpnia". Month names are
needed in two cases: genitive for the day form (stycznia, lutego, marca,
kwietnia, maja, czerwca, lipca, sierpnia, września, października, listopada,
grudnia) and nominative, upper-cased, for `41`'s month headings (STYCZEŃ, LUTY,
MARZEC, KWIECIEŃ, MAJ, CZERWIEC, LIPIEC, SIERPIEŃ, WRZESIEŃ, PAŹDZIERNIK,
LISTOPAD, GRUDZIEŃ).

`src/lib/eventText.ts` turns events into the sentences on `25` and `35`. Two
exported pieces:

    export type ActivityGroup = {
      id: string            // the newest event's id — a stable React key
      type: EventType
      actorId: string
      createdAt: string     // the newest event in the group
      events: AppEvent[]    // newest first
      /** set when a list.created group swallowed the items added with it */
      addedWithList?: AppEvent[]
    }

    export function groupEvents(events: AppEvent[]): ActivityGroup[]

    export type Described = { actor: string; rest: string; items?: string[] }
    export function describe(group: ActivityGroup, ctx: {
      currentPersonId: string
      personName: (id: string) => string
      itemName: (id: string) => string
    }): Described

`groupEvents` takes events newest-first and folds runs together: an event joins
the group in front of it when the actor and the type match and it is within ten
minutes of that group's oldest event. That is what turns Nina's three
`item.added` rows at 11:07 into "Nina dopisał(-a) 3 pozycje". One special case
follows: a `list.created` group immediately followed by an `item.added` group by
the same actor within ten minutes absorbs it, which is `25`'s "Ty utworzył(-a)
listę i dodał(-a) 8 pozycji".

`describe` returns the actor and the rest separately because `25` sets the name
in bold and the rest regular. `actor` is the person's name, or the literal "Ty"
when the actor is the current person — followed by the same verb form as
everyone else, per the Decision Log. `items` is filled only for `item.added`
groups of more than one, and is what `25` renders in a grey chip. The full
sentence table is in "Copy that no mockup provides" above; implement exactly
those strings and no others.

Also add `joinNames(names: string[]): string` — "Kuba", "Kuba i Nina", "Kuba,
Nina i Ola" — which mockup `15` needs for "Kuba i Nina zobaczą ją od razu".

**The seed.** `src/db/seed.ts` currently produces 20 events: the Przestrzeń,
three people, four notes and "Biedronka, sobota" with eight items. Extend it so
that `35` and `41` have content. First move the Przestrzeń's creation from 30
days ago to **45** days ago, because the archived lists below are dated up to 31
days back and a list cannot predate the Przestrzeń it belongs to. Then add:

- `list.pinned` on "Biedronka, sobota", by Ala, yesterday — the "PRZYPIĘTA"
  section of `35`;
- "Drogeria" — Nina, yesterday, 4 items, none checked ("0 z 4" on `35`);
- "Pakowanie na wyjazd" — Ala, two days ago, 12 items of which 7 are checked,
  the most recent event being Ala checking "Buty" so the card reads "Ty
  odhaczył(-a) Buty · 2 dni temu";
- "Kawa i herbata" — Kuba, five days ago, 3 items of which 1 is checked;
- five archived lists, dated so that they reproduce `41` when run in August:
  "Lidl, czwartek" (7 days ago, completed), "Urodziny Oli" (14 days,
  completed), "Chemia do łazienki" (16 days, **manual**, and left unfinished so
  its row reads "2 z 6"), "Bieszczady, maj" (22 days, completed), "Kajaki"
  (31 days, completed).

Each archived list gets four to six plausible items rather than the 9, 14 and 22
its mockup subtitle claims; the counters are computed, so they will read what is
actually there. `41`'s header will read "5 list" rather than "8 list" for the
same reason — see the Decision Log. Keep the invented item names ordinary and
few: shampoo, toothpaste, sun cream, a sleeping bag, and so on.

Every one of these goes through the actions, never through a table, so the seed
keeps producing a genuine event log — which is the whole point of it, since `25`
and M6's feed are that log read back.

**The check screen.** In `src/app/db.tsx`, replace the raw
`{localTime(...)} · {event.type}` line with a rendered sentence, using
`groupEvents` and `describe`. This is the milestone's visible result and it
doubles as the first real test of the formatter.

**Acceptance.**

    npx tsc --noEmit
    # Expected: no output, exit code 0

Then, with the dev server running and the app open on an already-booted device,
go to the "Ty" tab → "Database check", press "Reset and seed", and confirm:

- the lists section shows nine lists — "Biedronka, sobota" plus three active and
  five archived,
- the event log reads as Polish sentences: "Kuba odhaczył(-a) Chleb",
  "Nina dopisał(-a) 3 pozycje", "Ty utworzył(-a) listę i dodał(-a) 8 pozycji",
- pressing "Add 20 items" still works and still costs one render, and the new
  rows appear at the top of the log.

Verify before proceeding: the migration file exists, `_journal.json` lists it,
and a fresh install (wipe and reseed) reaches the same state as an upgrade.


### Milestone 2 — The list index and the list detail read from the database

This is the milestone that makes the app look like the mockups. Two screens,
both read-only apart from checking an item off. At the end, `35` and `07` are
real, `39` is correct in the dark theme, and `15` shows for a list with no items.

**`src/app/(tabs)/lists.tsx` — mockup `35`.** Four live queries — the space's
lists, the item counts, the recent list activity, and the people — joined in
JavaScript. Split the lists three ways: pinned (`pinnedAt` set, `archivedAt`
null), active (both null), archived (`archivedAt` set). The existing
`listsInSpace` already excludes soft-deleted rows and orders by `updatedAt`
descending, which is the order `35` draws.

The header is content, not a native bar: "MIESZKANIE 14" as a muted `label`, the
Przestrzeń's name read from the database; "Listy" as `titleLarge`; and "Nowa" on
the right in accent, which does nothing until Milestone 5 — so in this milestone
**leave it out** rather than drawing a dead action.

Section headings: a pin icon plus "PRZYPIĘTA" (omit the whole section when
nothing is pinned), "AKTYWNE · N", and "ARCHIWUM · N" with "Pokaż ›" on the
right. `SectionLabel` today takes a single string child; give it two optional
props — `icon?: IconName` and `right?: ReactNode` — and keep its rendering
byte-identical when neither is passed, so no existing caller changes. Add the
new variant to `/gallery`.

Under the archive heading sits the info strip from `35`: a rounded `tileFill`
block with a green `check` icon and "Zamknięte listy schodzą tu po odhaczeniu
wszystkiego". No archived rows are listed on this screen — only the count and
the way in.

Each card is a `Card` holding a title row (title on the left, counter on the
right), a `ProgressBar`, and an activity line: a small `Avatar` for the actor,
then `describe(...)` of the newest group for that list, then " · " and
`shortWhen`. When a list has no event in the window, fall back to the list's own
`createdBy`/`createdAt`, which is always present. The pinned card's counter sits
in a filled `selectedSurface` badge; the others are plain muted text. Tapping a
card pushes `/list/<id>`.

Two sizes need checking rather than guessing, using the method in
`docs/DESIGN.md` — x-height in the mockup **and** the rendered width of a known
string, which must agree: the card title on `35`, and the avatar diameter on the
activity line. Start from `bodyMedium` and 24 pt. If either clearly disagrees,
measure it and add a token with a comment naming the screen. Do not eyeball.

**`src/app/list/[id].tsx` → `src/app/list/[id]/index.tsx` — mockups `07`, `39`,
`15`.** Move the file first so the routes added later have a home, and update
the `Stack.Screen name='list/[id]'` entry in `src/app/_layout.tsx` to
`list/[id]/index`. The native header stays as M2 configured it: no title, back
title "Mieszkanie 14".

Below it, the title block: the list title as `titleLarge`, and on the right, in
two right-aligned lines, "2 z 8" over "odhaczone" — or, when the list is empty,
`15`'s "0 pozycji" over "N osoby", the person count coming from
`membersOfSpace`. Then "DO KUPIENIA" over the unchecked items in `position`
order, and "ODHACZONE · N" over the checked ones, most recently checked first.

Rows are `CheckboxRow`, which needs one addition: a `right?: ReactNode` slot.
Unchecked rows put the author's `Avatar` there; checked rows put the checker's
name as muted `bodySmall`, with no avatar — that is `07`, and where `39`
disagrees `07` wins.

The subtitle is built by a small local helper: the quantity as "×2" when it is
greater than 1, then the note, then the author — "×2 · Kuba", "duża paczka ·
Nina", "Ty" — with "Ty" standing in for the current person. Empty parts are
dropped, not rendered as stray separators.

One primitive change to check against the mockup: in `07` and `39` the entire
checked row is dimmed, not just its title — the filled circle is visibly lighter
than the accent used elsewhere on the same screen, which is what a row at
roughly 55 % opacity looks like. `CheckboxRow` currently animates only the
title's opacity. Move that animation to the row's content wrapper and compare the
result against `07` at 2×. If the circle still does not match, measure it and add
a token; do not tint it by eye.

The empty state is `15`: the `empty-list` illustration through `Illustration`,
"Lista jest jeszcze pusta", and "Dopisz pierwszą rzecz albo wklej całą listę z
notatki." followed by "<Kuba i Nina> zobaczą ją od razu." built with
`joinNames`. When the Przestrzeń has no other members, render only the first
sentence rather than inventing copy for a case no mockup covers. The "CZĘSTE U
WAS" chips under it belong to Milestone 3.

The quick-add bar at the bottom of `07` also belongs to Milestone 3. Until then
the screen ends after the last row. This is deliberate: a bar that cannot accept
input is worse than no bar.

**Acceptance.**

    npx tsc --noEmit
    # Expected: no output, exit code 0

On the device: the Zakupy tab matches `35` — one pinned card with a filled badge
and a bar around a third full, three active cards, an ARCHIWUM heading reading 5
with "Pokaż ›" and the info strip. Open "Biedronka, sobota": eight rows split six
and two, subtitles reading "×2 · Kuba" and "duża paczka · Nina", the header
counter "2 z 8 / odhaczone". Tick "Mleko owsiane": the row travels into
ODHACZONE with its layout animation, the counter becomes "3 z 8", and going back
shows the card's bar and counter already updated. Force-quit and reopen: still
true. Switch the device to the dark theme and check the same screen against `39`.

Add the `07` vs `39` row to the defects table in `docs/DESIGN.md` in this
milestone.


### Milestone 3 — Quick-add: the bar, the parser, the draft row, the suggestions

Mockups `08` and `15`. At the end of this milestone the core loop closes: you can
put something on a list from the list.

**Spike first, half an hour at most.** No screen in this app has ever had a text
input pinned above the keyboard. Put a `TextInput` inside a `KeyboardAvoidingView`
at the bottom of the list detail screen and check both platforms: on iOS with
`behavior='padding'` and the header's height as `keyboardVerticalOffset`, and on
Android, where the activity resizes by default and `behavior={undefined}` is
usually right. Watch for the bar being hidden behind the keyboard, the list not
scrolling to the bottom, and the Android edge-to-edge inset. Record what happened
in Surprises & Discoveries either way. If neither combination works, stop and
ask: the known fallback is `react-native-keyboard-controller`, which is a native
module and therefore needs both development builds rebuilt — that is the repo
owner's call, not yours.

**`src/lib/parseItem.ts`.**

    export type ParsedItem = { name: string; quantity: number; note: string | null }
    export function parseItem(input: string): ParsedItem | null

The rules, which are exactly what `08` and `19` state in their own hint lines
(„x2" czytamy jako ilość, tekst po przecinku jako dopisek; Ilości typu „x2" albo
„10" wpisujemy w osobne pole):

1. trim; return `null` for an empty string, so callers have one thing to check;
2. split on the **first** comma — everything after it, trimmed, is the note; an
   empty note is `null`;
3. in the part before the comma, look at the last whitespace-separated token: if
   it matches `x2`, `X2`, `×2` or a bare integer, and removing it leaves at least
   one non-numeric word, it is the quantity. Clamp to 1–99;
4. collapse runs of whitespace, then upper-case the first character with
   `toLocaleUpperCase('pl')` — `08` shows "kawa ziarnista" being typed and `07`
   shows "Kawa ziarnista" on the list, and `19` does the same to every line;
5. quantity defaults to 1.

Check the cases the mockups contain: `mleko owsiane x2` → Mleko owsiane ×2;
`jajka 10` → Jajka ×10; `papier, duża paczka` → Papier + note; `Ziemniaki 2 kg`
→ unchanged, quantity 1, because the last token is "kg"; `worki 60l` → unchanged,
because "60l" is not an integer.

**The bar.** A `View` pinned below the list, inside the keyboard-avoiding
wrapper, holding a round accent "+" (the `plus` icon), a `TextInput` with the
placeholder "Dodaj pozycję…" — "Dodaj pierwszą pozycję…" when the list is empty,
per `15` — and "Wklej listę" on the right, which is added in Milestone 6 and
until then is left out. When the input has focus and content, the "+" is replaced
by the round accent `arrow-up` button on the right that `08` draws. Submitting
happens on that button and on the keyboard's return key, with `blurOnSubmit`
false so several items can be typed in a row; the field clears after each.

Its height and corner radius are the two values most likely to need measuring;
try the spacing and radius scales first and measure from `07` at 2× only if they
disagree.

**The draft row.** While the input is non-empty, `08` draws the item where it
will land: a row with a `selectedSurface` background, a hollow circle, the text
**as typed** — lower case, because that is what the mockup shows — and "dodaj" in
accent on the right, which commits it. Under it, the hint line, verbatim from
`08`: „x2" czytamy jako ilość, tekst po przecinku jako dopisek — „papier, duża
paczka".

**The suggestions.** Under the hint, the chips from `frequentItemNames`, with the
caption "częste u Was" trailing them on the same line as `08` draws it. On the
empty list of `15` they instead appear in the empty state under a "CZĘSTE U WAS"
label, each prefixed with "+". Take the snapshot when the input gains focus (and
when the screen mounts, for `15`); it does not need to be live. A chip on `15`
adds its item immediately — the "+" says so. A chip on `08`, where something is
already half-typed, replaces the input's contents instead, because adding
silently while the user is mid-word would lose their typing.

Hide the chip row entirely when the query comes back empty. On a fresh install
with one list it will.

**The header while typing.** `07` puts "Udostępnij" in the header right and `08`
puts "Gotowe" there. Since "Udostępnij" is not implemented (A1) and the slot goes
to the "..." menu (D-Q2), the rule is: the header right shows "Gotowe" while the
input has focus — dismissing the keyboard — and the "..." at all other times.

**Acceptance.**

    npx tsc --noEmit
    # Expected: no output, exit code 0

On the device, in both themes and on both platforms: open "Biedronka, sobota",
tap the bar. The keyboard comes up, the bar sits directly above it, and the list
is still scrollable. Type `ser żółty x3`; a highlighted draft row appears reading
"ser żółty" with "dodaj". Press the round button: the row becomes "Ser żółty"
with "×3 · Ty", the counter goes to "2 z 9", and the field is empty and still
focused. Type `papier, duża paczka` and submit: the subtitle reads "duża paczka ·
Ty". Press "Gotowe": the keyboard goes away and the header shows the dots again.
Open the empty list from Milestone 5's flow, or temporarily point at a list with
no items, and confirm `15`: illustration, both sentences, "CZĘSTE U WAS" and four
"+" chips, one of which adds an item on tap.


### Milestone 4 — The item sheet, and the two primitives it needs

Mockup `28`. At the end you can hold any row on a list and change what it says,
or delete it.

**`src/components/ui/TextField.tsx`.** `28` uses two field looks and both recur
later — `17` and `01` in M7 use the same shapes — so this is a primitive, not a
local component. Props: `value`, `onChangeText`, `placeholder`, `variant:
'underline' | 'filled'`, `autoFocus`, `multiline`, and the label handled by the
caller so that "NAZWA" and "DOPISEK" stay ordinary `SectionLabel`s. `underline`
is a hairline bottom border in `border`; `filled` is a `tileFill` background at
`radius.md`. Measure the field height and the horizontal padding from `28` at 2×.
Add it to `/gallery` in both variants.

**`src/components/ui/Stepper.tsx`.** The − 1 + control. Props: `value`,
`onChange`, `min = 1`, `max = 99`. The minus is disabled at `min`, the plus at
`max`, and both use `usePressScale` like every other pressable in this repo. Add
it to `/gallery`.

**`src/app/item/[id].tsx`.** A `formSheet` route registered in
`src/app/_layout.tsx`, copying the block already there for `name='new'`:
`fitToContents` on iOS, an explicit fraction on Android, `sheetCornerRadius` set
from `radius.xl`, `sheetGrabberVisible` true. Measure the sheet's height in `28`
the way `05`'s 0.36 was measured — the sheet's height in points over the screen's
height — and expect something near 0.45; write the number you measured into the
comment, not this estimate.

The screen reads the item with `itemById` and the people with `allPeople`, holds
name, quantity and note in local state seeded from the row, and renders: the
"POZYCJA" label with "Zapisz" in accent on the right; "NAZWA" over an `underline`
field; "ILOŚĆ" over the `Stepper` beside "DOPISEK" over a `filled` field; the
chips from `frequentNotesFor` for that item's name, each of which fills the note
field on tap; the two lines of explanatory copy from `28` verbatim ("Dopisek
widzą wszyscy na liście — dobre miejsce na markę, rozmiar albo „ten w zielonym
pudełku"."); and a footer with the author's avatar, "Dodał(-a) <imię> · <whenLong>"
and "Usuń" in `danger`.

"Zapisz" calls `editItem` and pops the sheet. It is disabled when nothing changed
and when the name is blank — an item with no name is not something the log should
record. "Usuń" opens an `Alert` and, on confirmation, calls `removeItem` and
pops. Wire `onLongPress` on the list's `CheckboxRow`s to push this route, and leave
`onPress` to check the item off — the commonest action in the app should not be
reachable only by hitting a 26 pt circle. See the Decision Log; the same entry
covers the sideways drags that do both without aiming.

Watch for the keyboard here too: a sheet with a focused field has to lift on iOS.
If it does not, wrap the sheet's content in the same keyboard-avoiding wrapper
Milestone 3 settled on and record it.

**Acceptance.**

    npx tsc --noEmit
    # Expected: no output, exit code 0

On the device: tap "Papier toaletowy" on "Biedronka, sobota". The sheet matches
`28` — name, quantity 1, note "duża paczka", the footer reading "Dodał(-a) Nina ·
<the seeded time>". Raise the quantity to 3, change the note, press "Zapisz": the
row now reads "×3 · nowy dopisek · Nina". Reopen it, press "Usuń", confirm: the
row disappears and the counter drops. Check the sheet in the dark theme, and on
Android, where the detent is a fraction rather than a measurement.


### Milestone 5 — Creating a list, naming it, renaming it, pinning it

D-Q2 and D-Q3 settle the two things no mockup draws: the list detail header
gets a "..." menu in the slot `07` gives to "Udostępnij", and a list is named in
a small sheet before it exists. This milestone builds both.

**`src/app/new-list.tsx`** — a `formSheet` route with one `underline`
`TextField`. Copy: the "NOWA LISTA" label, the placeholder "np. Biedronka,
sobota", a primary "Utwórz" disabled while the field is blank, and "Anuluj".
It accepts one optional search parameter, `copyFrom=<listId>`, used by Milestone
8: when present, the field is prefilled with that list's title and, after the new
list is created, every item of the source list is re-added in `position` order
with its quantity and note preserved and its checked state dropped. On success it
replaces itself with `/list/<newId>`, so the back gesture returns to where the
sheet was opened from rather than to the sheet.

**`src/app/list/[id]/rename.tsx`** — the same shape, prefilled with the current
title, labelled "ZMIEŃ NAZWĘ", with "Zapisz". Calls `renameList`.

**`src/app/list/[id]/menu.tsx`** — a `formSheet` holding the actions D-Q2 names,
rendered as `ListRow`s with icons: "Zmień nazwę" (`note`), "Przypnij do góry" /
"Odepnij" (`pin`, the label following the list's current state), "Historia
zmian" (`clock`, added in Milestone 7), "Schowaj do archiwum" (`basket` — or
whichever of the 22 icons in `assets/icons/` reads best; do not draw a new one
for this), "Usuń listę" in `danger`, and "Anuluj". The same route serves an
archived list with a different set — see Milestone 8 — so branch on the list's
`archivedAt` rather than creating a second sheet.

**`src/app/new.tsx`** — the "Co tworzymy" sheet from `05`. The "Lista zakupów"
option must lead to `/new-list`. Presenting a sheet from a sheet is the one part
of this that is not obviously safe: try `router.replace('/new-list')` first,
which should swap the screen inside the presented sheet, and if the detents fight
each other, dismiss first and push after the dismissal completes. Whatever works,
write down which and why in Surprises & Discoveries — M5 will need the same trick
for "Notatka".

**`src/app/(tabs)/lists.tsx`** — add the "Nowa" action to the header now that it
has somewhere to go, pushing `/new-list` directly.

**Acceptance.**

    npx tsc --noEmit
    # Expected: no output, exit code 0

On the device: from the Zakupy tab press "Nowa", type "Niedziela, Lidl", press
"Utwórz". You land on the new list showing `15` — the illustration, both
sentences, and the suggestion chips, which now have real history to draw on.
Add an item from a chip. Go back: the new list is in AKTYWNE with "0 z 1".
Open the "..." menu, pin it: it moves to PRZYPIĘTA and "Biedronka, sobota" drops
into AKTYWNE, because only one section header is drawn per state and both lists
are pinned — confirm that reads sensibly, and if two pinned lists look wrong,
that is a question for the owner, not a thing to fix silently. Rename it and
confirm the title changes on both screens. Then press the raised "+" in the tab
bar, choose "Lista zakupów", and confirm the same sheet appears.


### Milestone 6 — Paste a whole list

Mockup `19`. At the end you can turn six lines of text into six items.

**The clipboard decision, made at the start of this milestone, not silently.**
Reading the clipboard needs `expo-clipboard`, which is a native module: adding it
means `npx expo install expo-clipboard` followed by rebuilding **both**
development builds (`npm run ios`, `npm run android`), which took about twelve
minutes for Android on this machine last time. Ask the owner before doing it. The
fallback, which needs no rebuild and no new dependency, is to open the screen
with an empty, focused, multiline field and let the person paste into it with the
system menu; the screen works identically from there on. React Native still
exports a `Clipboard` module of its own, but it logs a deprecation warning and is
scheduled for removal, so it is not the answer.

Note for either path: on iOS 16 and later, reading the clipboard programmatically
raises the system "Allow Paste?" prompt. That is expected and is not a bug to
work around.

**`src/app/list/[id]/paste.tsx`** — a route with `presentation: 'modal'` and a
native header: "Anuluj" on the left, the title "Wklej listę", "Dodaj" on the
right. Below it, the "WKLEJONY TEKST" label over a multiline field on `tileFill`
holding the pasted text in `fontFamily.mono`, the token D-Q4 adds. This is the
only place in the app that uses it, because it is the only place where the
monospace carries meaning: the block is raw text the person pasted, not app
copy. The field stays editable, so a bad paste can be fixed in place.

Under it, "ROZPOZNANE POZYCJE · N" with "Odznacz wszystkie" on the right —
becoming "Zaznacz wszystkie" once nothing is selected — then the parsed rows.
Each line of the pasted text that is not blank goes through `parseItem`; the
result is a row with a checkbox, the name, and a quantity badge reading "×2" when
the quantity is above 1. Everything starts selected. Exactly as `19` draws it,
only the first **four** rows are listed, followed by "i N dalszych pozycji" in
muted text — as a plural key in the message files, since `src/lib/plural.ts` was
deleted by M4b.

The hint under them is verbatim from `19`: "Jedna linia to jedna pozycja. Ilości
typu „x2" albo „10" wpisujemy w osobne pole."

At the bottom, a full-width primary `Button` labelled "Dodaj N pozycji do listy",
as a plural key with the counted noun in the accusative — the same case as
`activity.items`, which M4b already holds — disabled when nothing is selected. It calls `addItems` with the selected rows and pops back to the list.
The header's "Dodaj" does the same thing.

Finally, add "Wklej listę" to the right of the quick-add bar built in Milestone
3; it pushes this route. That is the entry point `07`, `15` and `39` all draw.

**Acceptance.**

    npx tsc --noEmit
    # Expected: no output, exit code 0

On the device: copy these six lines into the clipboard from any app —

    mleko owsiane x2
    chleb żytni
    masło extra
    jajka 10
    papier toaletowy
    worki 60l

— open a list, press "Wklej listę". The text appears (or you paste it), the
header reads "ROZPOZNANE POZYCJE · 6", four rows are listed with "Mleko owsiane
×2" and "Jajka ×10" carrying badges, "i 2 dalsze pozycje" follows, and the button
reads "Dodaj 6 pozycji do listy". Deselect "Jajka": the button reads "Dodaj 5
pozycji do listy", which is exactly what `19` shows. Press it: five items land on
the list, in order, with their quantities, and the history screen built next will
show them as one grouped line.


### Milestone 7 — Change history, with restore

Mockup `25`. At the end, everything the log has been recording since Milestone 1
is visible, and two kinds of mistake can be undone.

**`src/app/list/[id]/history.tsx`** — pushed from the list's "..." menu, with the
native back title set to the list's own name, as `25` shows. The content header is
"Historia zmian" as `titleLarge` over "Ostatnie 30 dni" as muted `bodySmall`, and
the window is real: `eventsForList(listId, thirtyDaysAgoIso)`.

Three live queries — the events, `allItemsInList` (deleted rows included, which
is why that query exists), and `allPeople` — then `groupEvents` over the events
and `describe` over each group. Rows are grouped into day sections headed by
`dayHeading`: "DZIŚ", "WCZORAJ", "12 SIERPNIA".

Each row: the time in a left gutter via `clockTime`, the actor's `Avatar`, and
the sentence with the actor's name in the medium weight and the rest regular. An
`item.added` group of more than one also renders `described.items` joined with
" · " inside a `tileFill` chip — "kawa ziarnista · ziemniaki 2 kg · worki 60 l"
on `25`.

"Przywróć" appears on the right of a row when, and only when, the row is a group
of exactly one event of type `item.checked` or `item.removed` **and** the item is
still in that state — the item is still checked, or still deleted. Undoing
something that someone has already undone would append a nonsense event. Pressing
it calls `uncheckItem` or `restoreItem`, which appends the inverse event; the row
you pressed stays where it is, because the log is append-only, and a new row
appears at the top saying what you just did. That is the behaviour to check for
in acceptance — it is the clearest demonstration in the app that this is an event
log and not a mutable table.

Two things `25` shows that are **not** implemented, per A2: "Kuba dołączył(-a) do
listy" and "Ty udostępnił(-a) listę całej Przestrzeni". No event in this app
produces either sentence.

Add the `25` vs `35` row to the defects table in `docs/DESIGN.md` in this
milestone — the "Ty odhaczył(-a)" versus "Ty odhaczył(-a)ś" disagreement.

**Acceptance.**

    npx tsc --noEmit
    # Expected: no output, exit code 0

On the device: open "Biedronka, sobota" → "..." → "Historia zmian". Under "DZIŚ"
you see Kuba's two checks grouped as one row and Nina's two additions grouped as
another; under "WCZORAJ", "Ty utworzył(-a) listę i dodał(-a) 6 pozycji" with the
seeded times. Press "Przywróć" next to Kuba's check: a new row appears at the top
reading "Ty odznaczył(-a) Chleb", the old row loses its "Przywróć", and going
back shows "Chleb" under DO KUPIENIA again with the counter down by one. Delete
an item from its sheet, come back here, and restore it the same way.


### Milestone 8 — The archive, and lists that close themselves

Mockup `41`, plus the automatic archiving that `35` and `docs/PROJECT.md`
describe. Per D-Q1 a list archives itself the moment its last unchecked item is
ticked.

**Automatic archiving lives in the action layer, not in the reducer.** After
`checkItem` applies its event, it counts the list's remaining unchecked,
non-deleted items; if there are none, it appends a second event,
`list.archived` with `reason: 'completed'`. Symmetrically, `uncheckItem` appends
`list.unarchived` when the list it just touched was archived with reason
`'completed'` — a list hidden by hand stays hidden until someone unhides it.
Two events, two transactions, one tap; both are pushed by M8 in the order they
were appended, and the reducer stays true to the M3 rule that applying an event
never depends on what this device already knows.

**`src/app/archive.tsx`** — pushed from the "Pokaż ›" on `35`, with the back
title "Listy" and "Wyczyść" in the header right. The content header is "Archiwum"
as `titleLarge` with "N list" over the Przestrzeń's name right-aligned beside it,
as a plural key in the message files; `src/lib/plural.ts` no longer exists.

Rows are grouped by the month of `archivedAt`, newest month first, under
`monthHeading` — "SIERPIEŃ", "LIPIEC". Each row is a `ListRow` with: a `success`
`check` icon on the left when the list was archived complete, or a muted
`minus-circle` when it was hidden by hand; the title; a subtitle reading
"<N> pozycji · zamknięta <12 sierpnia>" for a completed list and
"<c> z <n> · schowana ręcznie <3 sierpnia>" for a manual one, which is exactly
what `41` draws for "Chemia do łazienki"; and a `more` icon on the right opening
the menu sheet from Milestone 5 in its archived variant: "Przywróć do
aktywnych", "Skopiuj pozycje na nową listę", "Usuń na zawsze", "Anuluj". Those
first three strings are named verbatim in `41`'s own info strip, which is also
rendered at the bottom of the screen with the `info` icon.

"Przywróć do aktywnych" calls `unarchiveList`. "Skopiuj pozycje na nową listę"
pushes `/new-list?copyFrom=<id>`. "Usuń na zawsze" opens an `Alert` and calls
`deleteList`, which sets `deleted_at`; the row is gone from every screen, and the
events stay in the log because the log is append-only. "Wyczyść" in the header
does the same for every archived list at once, behind an `Alert` naming how many
will go.

When there is nothing archived, render an `EmptyState` with "Archiwum jest puste"
and no illustration — `docs/DESIGN.md` records that no illustration exists for
this case, and inventing one is not this milestone's job.

**Acceptance.**

    npx tsc --noEmit
    # Expected: no output, exit code 0

On the device: from the Zakupy tab press "Pokaż ›". The archive matches `41` —
month headings, green checks, one grey minus for "Chemia do łazienki" with its
"2 z 6 · schowana ręcznie" subtitle, the info strip at the bottom. Restore
"Kajaki": it leaves the archive and appears under AKTYWNE. Copy "Lidl, czwartek"
to a new list: the sheet opens prefilled, and the new list holds the same items,
all unchecked. Then the closing act: open a short list and tick its last
unchecked item. Go back — the list is no longer under AKTYWNE. Open the archive:
it is at the top of this month's group, marked complete and dated today. Open it,
untick an item: it returns to AKTYWNE. Check every one of those in both themes.

**Documentation, in this milestone.** `docs/ROADMAP.md`: mark M4 done in the
milestone table, update "Where the project stands" to name M5 as next, and fold
anything learned into the M4 section. `docs/DESIGN.md`: the two new defect rows
(added in Milestones 2 and 7) and any token that had to be measured. `AGENTS.md`
and `README.md`: the `src/lib/` row in the code-layout table — added back in
Milestone 1, checked here. If a new npm script or a new way of running the app
appeared, `docs/exec-plans/create-plan-file.md`'s "Project-Specific Conventions"
repeats the command list and must be updated too.


## Concrete Steps

Every command runs from the repository root,
`/Users/szymon/Documents/projects/peeers`.

The type checker is the only automated gate in this repo. There is no test suite
and `npm run lint` opens an interactive ESLint wizard — do not run it casually.

    npx tsc --noEmit
    # Expected: no output, exit code 0.
    # A failure looks like:
    #   src/db/apply.ts(212,10): error TS2322: Type '{ … }' is not
    #   assignable to type 'never'.
    # which is the exhaustiveness guard telling you an event type has no branch.

After any edit to `src/db/schema.ts`:

    npm run db:generate
    # Expected, roughly:
    #   Reading config file '…/drizzle.config.ts'
    #   2 tables changed
    #   [✓] Your SQL migration file ➜ src/db/migrations/0002_<name>.sql 🚀
    # Then check the file: it should contain the ALTER TABLE and CREATE INDEX
    # statements and nothing else, and meta/_journal.json should have a new
    # entry. Without this command the schema edit does nothing at runtime.

The dev server. The repo owner normally has it running; check before starting
your own, and if you start one, stop it when you are done and leave 8081 free:

    lsof -ti:8081 || echo "8081 free"
    npm run dev
    # Metro prints a banner; confirm it says React Compiler enabled.

Both platforms run from a **development build**, not Expo Go. Rebuilds are only
needed when native code or configuration changes — in this milestone that means
only the `expo-clipboard` decision in Milestone 6:

    npm run ios
    npm run android      # needs JDK 17; see README.md

If a rebuild is needed, ask the owner first: Android took about twelve minutes
last time, and both commands drive devices the owner started.


## Validation and Acceptance

Each milestone above ends with its own acceptance section; those are the primary
gate and they are written as behaviour, not as code inspection. What follows is
what must hold when the whole milestone is finished.

**The type checker.**

    npx tsc --noEmit
    # Expected: no output, exit code 0

**The loop, end to end, on a device that is already booted.** With the dev server
running and the app open:

1. Zakupy tab matches `35`: a pinned card, three active cards, an ARCHIWUM
   heading with a count and "Pokaż ›", and the info strip.
2. "Nowa" creates a list; it opens showing `15`.
3. Typing `mleko owsiane x2` into the bar produces "Mleko owsiane" with "×2 · Ty".
4. Holding a row opens `28`; changing the quantity and saving updates the row;
   deleting removes it and drops the counter.
5. "Wklej listę" turns six pasted lines into six items.
6. "..." → "Historia zmian" shows the day-grouped log of everything above, with
   Nina's and Kuba's seeded events grouped into single lines.
7. "Przywróć" on a checked item unchecks it and appends a new row rather than
   erasing the old one.
8. Ticking the last unchecked item moves the list out of Zakupy and into the
   archive, dated today; unticking brings it back.
9. Force-quit the app and reopen it: everything above is still true.

**Both themes, both platforms.** `docs/DESIGN.md` is explicit that the dark theme
has its own token values and is easy to break unnoticed. Check `35`, `07`/`39`,
`28`, `19`, `25` and `41` in both. On Android also check: the sheets, which use a
fraction detent rather than `fitToContents`; the keyboard behaviour on the
quick-add bar; and the tab bar, whose Android adjustments are described in
`docs/DESIGN.md`. Remember that **every mockup is iOS** — an Android-specific
choice is a judgement call, and says so in a comment when you make one.

**Reduced motion.** Every animated component must honour `useReducedMotion()`,
and when the OS asks for reduced motion the animation must not play at all. The
new screens reuse `CheckboxRow`, `ProgressBar` and `AnimatedPressable`, which
already do; anything new that animates must too. The toggle is in Settings →
Dostępność → Ruch on the device — writing the simulator's plist has no effect on
a running device — and `/gallery` shows the current value in its header.

**Two things that are not "done" without them.** The documentation updates listed
at the end of Milestone 8, and a clean environment: no dev server left running,
port 8081 free, no changes staged or committed.


## Idempotence and Recovery

Everything here can be run more than once.

**The seed** returns immediately when `current_person_id` is already set, so
launching the app repeatedly does not duplicate anything. To pick up seed
changes, use "Reset and seed" on `/db`, which wipes every table in one
transaction and reseeds. It is the fastest recovery path for almost any data
mistake in this milestone, and it is development-only.

**Migrations** are applied at startup by `useMigrations` in
`src/hooks/useDatabase.ts` and are tracked in the database, so re-running the app
re-applies nothing. `npm run db:generate` is safe to re-run; if it produces a
migration you did not want, delete the generated `.sql` file **and** its entry in
`src/db/migrations/meta/_journal.json` and its snapshot under `meta/`, then
regenerate. Never hand-edit a migration that has already run on a device you care
about — reset and reseed instead.

**Rolling back the schema change.** The two columns added in Milestone 1 are
additive and nullable. If the milestone is abandoned, removing them from
`schema.ts` and regenerating produces a migration that drops them; existing
development databases are disposable, so a wipe-and-reseed is the simpler path.

**If the app renders nothing at startup**, the migration failed:
`src/app/_layout.tsx` returns `null` deliberately in that case and logs
`[db] migrations failed` to the Metro console. Read that log rather than guessing.

**If a screen shows stale data**, suspect the one-table rule before suspecting
`useLiveQuery`: a query that joins two tables only refreshes when the table it
selects **from** changes. Split it into two live queries and join in JavaScript.

**If Metro behaves strangely after a config change**, restart it with `--clear`.
Metro does not reload `metro.config.js` by itself.

**Nothing in this milestone is destructive to the owner's environment.** No files
outside the repository are touched, no simulator or emulator is started, and no
git command that writes is ever run.


## Artifacts and Notes

Collect evidence here as the work proceeds. At minimum, by the end this section
should hold:

- the output of `npm run db:generate` and the body of the generated migration,
- a transcript of `npx tsc --noEmit` failing on the exhaustiveness guard and then
  passing, which proves the guard still works,
- the measured values for anything that had to be measured — the sheet fraction
  for `28`, the quick-add bar's geometry, and any token added — each with the
  screen it came from, in the form `docs/DESIGN.md` requires,
- the finding from the keyboard spike in Milestone 3, on both platforms,
- a note of what `router.replace` did when the "Co tworzymy" sheet led to the
  "Nowa lista" sheet, since M5 will hit the same thing.

For reference, this is the shape of an event row after Milestone 1, as `/db`
prints it:

    {
      id:        "6f0…",
      spaceId:   "3ab…",
      actorId:   "9c1…",
      listId:    "77e…",          ← new: derived, local-only
      type:      "item.added",
      payload:   { itemId: "…", listId: "77e…", name: "Kawa ziarnista",
                   quantity: 1, note: null, position: 5 },
      createdAt: "2026-08-19T09:07:00.000Z",
      syncedAt:  null
    }


## Interfaces and Dependencies

**No new npm dependencies**, with one possible exception decided in Milestone 6:
`expo-clipboard`, installed with `npx expo install expo-clipboard` so the version
matches SDK 57, and requiring a rebuild of both development builds. Everything
else is already installed: `drizzle-orm` 0.45.2, `expo-sqlite` ~57.0.1,
`expo-crypto` ~57.0.1 for `randomUUID`, `react-native-reanimated` 4.5.1,
`react-native-screens` ~4.26.0.

Before writing any Expo-specific code, check the versioned documentation at
https://docs.expo.dev/versions/v57.0.0/ — `AGENTS.md` constraint 1 exists because
SDK 57 renumbered packages and changed APIs, and examples from earlier SDKs are
wrong often enough to matter.

The signatures that must exist when this milestone is finished:

    // src/db/events.ts
    export type ArchiveReason = 'completed' | 'manual'
    // EventPayloads gains: list.renamed, list.pinned, list.unpinned,
    // list.archived, list.unarchived, list.deleted,
    // item.edited, item.removed, item.restored

    // src/db/actions.ts
    export function renameList(input: { spaceId: string; listId: string
                                        title: string }, options?: EventOptions): void
    export function pinList(input: { spaceId: string; listId: string }): void
    export function unpinList(input: { spaceId: string; listId: string }): void
    export function archiveList(input: { spaceId: string; listId: string
                                         reason: ArchiveReason }): void
    export function unarchiveList(input: { spaceId: string; listId: string }): void
    export function deleteList(input: { spaceId: string; listId: string }): void
    export function editItem(input: { spaceId: string; listId: string
                                      itemId: string; name: string
                                      quantity: number; note: string | null }): void
    export function removeItem(input: { spaceId: string; listId: string
                                        itemId: string }): void
    export function restoreItem(input: { spaceId: string; listId: string
                                         itemId: string }): void
    export function addItems(input: { spaceId: string; listId: string
                                      items: ParsedItem[] }): void

    // src/db/queries.ts — live (unexecuted, one table each)
    export function listById(listId: string)
    export function allItemsInList(listId: string)
    export function itemById(itemId: string)
    export function itemCountsByList()
    export function listActivity(spaceId: string, limit: number)
    export function eventsForList(listId: string, sinceIso: string)

    // src/db/queries.ts — one-shot (executed immediately)
    export function frequentItemNames(spaceId: string, excludeListId: string,
                                      limit: number): string[]
    export function frequentNotesFor(spaceId: string, name: string,
                                     limit: number): string[]

    // src/lib/plural.ts — deleted by M4b; plural forms are message keys now

    // src/lib/time.ts
    export function clockTime(iso: string): string
    export function shortWhen(iso: string, now?: Date): string
    export function whenLong(iso: string, now?: Date): string
    export function dayHeading(iso: string, now?: Date): string
    export function monthHeading(iso: string): string
    export function dayMonth(iso: string): string

    // src/lib/parseItem.ts
    export type ParsedItem = { name: string; quantity: number; note: string | null }
    export function parseItem(input: string): ParsedItem | null

    // src/lib/eventText.ts
    export type ActivityGroup = { id: string; type: EventType; actorId: string
                                  createdAt: string; events: AppEvent[]
                                  addedWithList?: AppEvent[] }
    export type Described = { actor: string; rest: string; items?: string[] }
    export function groupEvents(events: AppEvent[]): ActivityGroup[]
    export function describe(group: ActivityGroup, ctx: DescribeContext): Described
    export function joinNames(names: string[]): string

    // src/components/ui/TextField.tsx
    export function TextField(props: { value: string
                                       onChangeText: (v: string) => void
                                       placeholder?: string
                                       variant?: 'underline' | 'filled'
                                       multiline?: boolean
                                       autoFocus?: boolean }): JSX.Element

    // src/components/ui/Stepper.tsx
    export function Stepper(props: { value: number
                                     onChange: (v: number) => void
                                     min?: number; max?: number }): JSX.Element

    // src/components/ui/SectionLabel.tsx — two optional props, defaults unchanged
    // src/components/ui/CheckboxRow.tsx — one optional prop: right?: ReactNode

Both new primitives are exported from `src/components/ui/index.ts` and shown in
`/gallery`, which is where they get checked against both themes.

Everything in `src/db/` that screens use is re-exported from `src/db/index.ts`;
screens import from `@/db` and never from a file beneath it. `src/lib/` gets no
barrel file — four unrelated helpers do not need one, and direct imports keep it
obvious where a Polish string comes from.


## Revision note

2026-08-19, first version. Written from `docs/ROADMAP.md`'s M4 section, the ten
mockups it names, and the data layer M3 left behind. Four questions were raised
(Q1–Q4), each naming the milestone it blocked.

2026-08-20, second revision. The repo owner answered all four and approved the
plan. Open Questions is now empty, the answers are D-Q1 to D-Q4 in the Decision
Log, and the sections they touch — Bird's Eye View, Tokens, Copy, and Milestones
3, 5, 6 and 8 — were rewritten against the answers rather than against the
recommendations. Every answer matched the recommendation, so no milestone
changed shape; what changed is that the conditional language is gone and the
monospace token is now a definite piece of work in Milestone 6.
