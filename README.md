# Book of Business Rebalancer

A single-page tool for account management leaders to prep a book of
business for rebalancing. This is **Pass 1**: upload, column mapping,
corporate hierarchy consolidation, and the locking layer. It answers one
question — *"which accounts are actually eligible to move?"* — and shows
its work in a scannable report so you can trust the input before any
rebalancing logic runs. Balancing (assigning unlocked accounts to reps)
and export are later passes.

## What this pass does

1. **Upload** a CSV or Excel roster, one row per account. A "What your
   file needs" panel up front explains every required and optional
   column and what mapping it unlocks.
2. **Map your columns.** Your headers won't match the app's field names,
   so you tell it which of your columns is the account name, ARR,
   segment, etc. Owner/rep is a repeatable mapping — map an AM column and
   a separate Renewal Manager column if accounts carry multiple ICs, and
   they'll all show up in the report.
3. **Consolidate corporate hierarchies.** If you map a parent/ultimate-parent
   column, every child account sharing a parent value is grouped into one
   consolidated unit — one logo, ARR summed across the group. A summary
   line reports how many accounts got folded into how many groups (e.g.
   *"51 accounts consolidated into 16 parent groups"*).
4. **Lock accounts that shouldn't move.** Five rules, each independently
   toggleable by whether you mapped the column it depends on:
   - Renewal date falls within a configurable window of today (default
     90 days)
   - Active renewal discussion flag is true
   - Active upsell pipeline flag is true
   - Recently-moved date falls within a configurable window of today
     (default 180 days)
   - Manual override flag is true

   A consolidated group is locked if **any** member account is locked —
   the whole logo stays put, not just the triggering subsidiary.
5. **Review the locking report** — every account or group, its owner(s),
   locked/unlocked status, and every specific reason it's locked (an
   account can trigger more than one rule at once). Click a consolidated
   group to expand its member accounts and see which one(s) triggered the
   lock. Summary cards up top show total accounts/groups, locked vs.
   unlocked, a breakdown of locked accounts by reason, and how many
   accounts were folded into consolidated groups.

Nothing here decides who an unlocked account moves *to* — that's the
rebalancing logic in a later pass. This pass only decides what's allowed
to move.

## File format

One row per account. Column headers can be anything — you map them to
these roles on screen 2.

**Required:**

| Role | What it is |
|---|---|
| Account Name | The name of the account/customer |
| ARR | Annual recurring revenue |
| Segment | Customer segment or tier (e.g. Enterprise, SMB) |
| Owner / Rep | The rep who owns the account. Map more than one column for multi-IC accounts (e.g. AM + Renewal Manager) |

**Optional, but recommended:**

| Role | Enables | If missing |
|---|---|---|
| Parent / Ultimate Parent ID | Hierarchy consolidation — child accounts grouped under one parent logo | Accounts are treated individually, not grouped |
| Renewal Date | Locks accounts with a renewal inside the configured window | That lock rule never triggers |
| Active Renewal Discussion Flag | Locks accounts in a live renewal conversation | That lock rule never triggers |
| Active Upsell Pipeline Flag | Locks accounts with open upsell/expansion pipeline | That lock rule never triggers |
| Recently Moved Date | Locks accounts that changed owners recently | That lock rule never triggers |
| Manual Override Flag | Locks any account flagged by hand, regardless of other rules | Accounts can only be locked by the automatic rules |
| Customer Health Score | Carried through to the report for context | Report omits it |

Flag columns accept common truthy/falsy spellings (`TRUE`/`FALSE`,
`Yes`/`No`, `Y`/`N`, `1`/`0`). Dates accept Excel date cells or common
string formats (`MM/DD/YYYY`, ISO, etc.).

## Locking rule details

- **Renewal window** — locked if the renewal date is within
  `renewalWindowDays` of today in either direction (covers an upcoming
  renewal *and* a recently-passed one that hasn't been closed out yet).
- **Recently moved** — locked if the recently-moved date is between 0 and
  `recentlyMovedWindowDays` days in the past. A future-dated "move" is
  ignored.
- Both window lengths are adjustable from the Locking Report screen and
  recompute the report live.

## Corporate hierarchy consolidation

If a parent/ultimate-parent column is mapped, rows sharing the same
(case-insensitive) parent value are grouped into one consolidated unit. A
parent value referenced by only one row doesn't merge with anything and
stays a standalone account. If a row's own account name matches the
parent value (i.e. the parent company has its own row in the file), that
row's name becomes the group's display name; otherwise the group is
labeled with the raw parent value.

## Running locally

Requires [Node.js](https://nodejs.org/) 18+ and npm.

```bash
npm install
npm run dev
```

This starts a Vite dev server (default `http://localhost:5174`) and opens
it in your browser.

To build a static production bundle:

```bash
npm run build
npm run preview   # serve the built output locally
```

## Sample data

[`samples/sample-roster.csv`](samples/sample-roster.csv) has 180 rows
built to exercise every branch of this pass:

- 4 segments (Enterprise, Mid-Market, SMB, Strategic)
- 16 parent/child hierarchy groups of varying size (2–5 accounts each),
  some with the parent's own row present (tests display-name resolution)
  and some without (tests the fallback label)
- Two rep columns (`Account Manager`, `Renewal Manager`) simulating a
  multi-IC book
- A mix of accounts hitting every lock reason individually, several
  hitting two or three reasons at once (to check the multi-reason
  display), and a healthy share hitting none (to check the unlocked
  path)

## Tech

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [SheetJS (`xlsx`)](https://sheetjs.com/) for parsing `.xlsx`/`.xls`/`.csv`
  uploads
- No backend — all parsing, consolidation, and locking logic runs
  client-side in the browser; uploaded files never leave your machine.
