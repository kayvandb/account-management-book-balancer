// Generates samples/sample-roster-v2.csv — a smaller, deliberately
// hand-designed test roster (as opposed to sample-roster.csv's larger,
// more randomized one) built to exercise specific pipeline behaviors that
// are easy to verify by eye. See the README section
// "Targeted test file: sample-roster-v2.csv" for what each case covers.
//
// Regenerate with: npm run sample:generate-v2

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(__dirname, '..', 'samples', 'sample-roster-v2.csv')

const TODAY = new Date(2026, 7, 24) // 2026-08-24, matches the app's other sample data

let seed = 7
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)]
}
function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min
}
function addDays(base, days) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}
function fmtDate(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${yyyy}`
}

// --- Segment-exclusive rep pools -------------------------------------------
// Names are prefixed by nothing special but grouped tightly below so it's
// obvious at a glance that no rep appears in more than one segment.
const REPS = {
  Enterprise: { am: ['Nora Ellis', 'Marcus Webb'], rm: ['Priya Anand', 'Derek Shaw'] },
  'Mid-Market': { am: ['Yuki Tanaka', 'Beatriz Solis'], rm: ['Fatima Noor', 'Liam Brooks'] },
  SMB: { am: ['Owen Clark', 'Sara Kim'], rm: ['Tomas Reyes', 'Ingrid Palmer'] }
}

const rows = []
const usedNames = new Set()
function uniqueName(base) {
  let name = base
  let i = 2
  while (usedNames.has(name)) {
    name = `${base} ${i}`
    i += 1
  }
  usedNames.add(name)
  return name
}

function row({
  name,
  parent = '',
  segment,
  arr,
  am,
  rm,
  renewal = '',
  discussion = 'No',
  upsellFlag = 'No',
  upsellValue = '',
  moved = '',
  override = 'No',
  health = ''
}) {
  rows.push({
    'Account Name': name,
    'Ultimate Parent Account': parent,
    'Customer Segment': segment,
    'Annual Recurring Revenue': `$${arr}`,
    'Account Manager': am,
    'Renewal Manager': rm,
    'Next Renewal Date': renewal,
    'Renewal Conversation Active?': discussion,
    'Upsell Opportunity Open?': upsellFlag,
    'Upsell Pipeline ($)': upsellValue === '' ? '' : `$${upsellValue}`,
    'Book Transfer Date': moved,
    'Do Not Move': override,
    'Health Score (0-100)': health
  })
}

// ============================================================================
// 1) Hierarchy groups — varying size, including the ownership-inconsistency
//    regression case (Vertex Holdings) and a no-parent-row fallback case
//    (Anchor Systems).
// ============================================================================

// G1 "Vertex Holdings" — Enterprise, 1 parent row + 5 children = 6 members,
// UNLOCKED, and deliberately inconsistent AM *and* RM ownership across
// members. This is the exact shape that surfaced Pass 2's double-counting
// bug (a consolidated group's current load credited in full to every
// distinct legacy owner instead of attributed per member) — keep it here
// as a regression fixture.
row({ name: 'Vertex Holdings', parent: 'Vertex Holdings', segment: 'Enterprise', arr: 220000, am: 'Nora Ellis', rm: 'Priya Anand', renewal: fmtDate(addDays(TODAY, 260)), health: 74 })
row({ name: 'Vertex Holdings EMEA', parent: 'Vertex Holdings', segment: 'Enterprise', arr: 180000, am: 'Marcus Webb', rm: 'Derek Shaw', renewal: fmtDate(addDays(TODAY, 310)), health: 68 })
row({ name: 'Vertex Holdings APAC', parent: 'Vertex Holdings', segment: 'Enterprise', arr: 150000, am: 'Nora Ellis', rm: 'Derek Shaw', renewal: fmtDate(addDays(TODAY, 200)), health: 81 })
row({ name: 'Vertex Holdings LatAm', parent: 'Vertex Holdings', segment: 'Enterprise', arr: 90000, am: 'Marcus Webb', rm: 'Priya Anand', renewal: '', health: 59 })
row({ name: 'Vertex Holdings Manufacturing', parent: 'Vertex Holdings', segment: 'Enterprise', arr: 60000, am: 'Marcus Webb', rm: 'Derek Shaw', renewal: fmtDate(addDays(TODAY, 400)), health: '' })
row({ name: 'Vertex Holdings Retail Div.', parent: 'Vertex Holdings', segment: 'Enterprise', arr: 40000, am: 'Nora Ellis', rm: 'Priya Anand', renewal: '', health: 77 })
// Total group ARR: 740,000 across 6 members, 2 AMs and 2 RMs mixed throughout.

// G2 "Anchor Systems" — Enterprise, 2 children, no parent row (tests the
// fallback display-name path), consistent ownership, UNLOCKED.
row({ name: 'Anchor Systems North', parent: 'Anchor Systems', segment: 'Enterprise', arr: 140000, am: 'Nora Ellis', rm: 'Priya Anand', renewal: fmtDate(addDays(TODAY, 340)), health: 71 })
row({ name: 'Anchor Systems South', parent: 'Anchor Systems', segment: 'Enterprise', arr: 95000, am: 'Nora Ellis', rm: 'Priya Anand', renewal: '', health: 66 })

// G3 "Beacon Analytics" — Mid-Market, parent row + 3 children = 4 members,
// consistent ownership, UNLOCKED.
row({ name: 'Beacon Analytics', parent: 'Beacon Analytics', segment: 'Mid-Market', arr: 130000, am: 'Yuki Tanaka', rm: 'Fatima Noor', renewal: fmtDate(addDays(TODAY, 250)), health: 70 })
row({ name: 'Beacon Analytics West', parent: 'Beacon Analytics', segment: 'Mid-Market', arr: 88000, am: 'Yuki Tanaka', rm: 'Fatima Noor', renewal: '', health: 63 })
row({ name: 'Beacon Analytics East', parent: 'Beacon Analytics', segment: 'Mid-Market', arr: 76000, am: 'Yuki Tanaka', rm: 'Fatima Noor', renewal: fmtDate(addDays(TODAY, 190)), health: '' })
row({ name: 'Beacon Analytics Subsidiary', parent: 'Beacon Analytics', segment: 'Mid-Market', arr: 54000, am: 'Yuki Tanaka', rm: 'Fatima Noor', renewal: '', health: 82 })

// G4 "Cobalt Partners" — SMB, 2 children, no parent row, consistent
// ownership, UNLOCKED.
row({ name: 'Cobalt Partners East', parent: 'Cobalt Partners', segment: 'SMB', arr: 48000, am: 'Owen Clark', rm: 'Tomas Reyes', renewal: fmtDate(addDays(TODAY, 220)), health: 75 })
row({ name: 'Cobalt Partners West', parent: 'Cobalt Partners', segment: 'SMB', arr: 36000, am: 'Owen Clark', rm: 'Tomas Reyes', renewal: '', health: 69 })

// ============================================================================
// 2) Locked standalone accounts — every individual lock reason at least
//    twice, plus 3 accounts locked for multiple overlapping reasons.
// ============================================================================

// Renewal within the default 90-day window (x3)
// Note: every locked Enterprise standalone account below is deliberately
// owned by Nora Ellis, not Marcus Webb — see the imbalance note above
// buildFlexibleBatch. Locked ARR can't move, so piling it onto Nora (who
// already gets most of the flexible Enterprise book too) makes her
// current total book dramatically larger than Marcus's, and the
// after-rebalance shift correspondingly obvious.
row({ name: 'Delta Dynamics', segment: 'Enterprise', arr: 320000, am: 'Nora Ellis', rm: 'Derek Shaw', renewal: fmtDate(addDays(TODAY, 45)), health: 72 })
row({ name: 'Ember Networks', segment: 'Mid-Market', arr: 140000, am: 'Beatriz Solis', rm: 'Liam Brooks', renewal: fmtDate(addDays(TODAY, 12)), health: 58 })
row({ name: 'Frostgate Systems', segment: 'SMB', arr: 62000, am: 'Sara Kim', rm: 'Ingrid Palmer', renewal: fmtDate(addDays(TODAY, -20)), health: 64 })

// Active renewal discussion (x2)
row({ name: 'Granite Ventures', segment: 'SMB', arr: 60000, am: 'Sara Kim', rm: 'Ingrid Palmer', discussion: 'Yes', health: 80 })
row({ name: 'Halcyon Analytics', segment: 'Enterprise', arr: 180000, am: 'Nora Ellis', rm: 'Priya Anand', discussion: 'Yes', health: '' })

// Active upsell pipeline (x2)
row({ name: 'Ironclad Networks', segment: 'SMB', arr: 75000, am: 'Owen Clark', rm: 'Tomas Reyes', upsellFlag: 'Yes', upsellValue: 40000, health: 61 })
row({ name: 'Juniper Dynamics', segment: 'Mid-Market', arr: 210000, am: 'Yuki Tanaka', rm: 'Fatima Noor', upsellFlag: 'Yes', upsellValue: 85000, health: 73 })

// Recently moved within the default 180-day window (x2)
row({ name: 'Keystone Solutions', segment: 'Enterprise', arr: 260000, am: 'Nora Ellis', rm: 'Priya Anand', moved: fmtDate(addDays(TODAY, -70)), health: 55 })
row({ name: 'Lighthouse Industries', segment: 'Mid-Market', arr: 130000, am: 'Beatriz Solis', rm: 'Fatima Noor', moved: fmtDate(addDays(TODAY, -150)), health: 67 })

// Manual override (x2)
row({ name: 'Meridian Logistics', segment: 'Enterprise', arr: 150000, am: 'Nora Ellis', rm: 'Derek Shaw', override: 'Yes', health: 84 })
row({ name: 'Nimbus Partners', segment: 'SMB', arr: 95000, am: 'Sara Kim', rm: 'Tomas Reyes', override: 'Yes', health: '' })

// Multi-reason (x3) — locked for more than one overlapping reason at once
row({
  name: 'Orbit Holdings',
  segment: 'Enterprise',
  arr: 400000,
  am: 'Nora Ellis',
  rm: 'Derek Shaw',
  renewal: fmtDate(addDays(TODAY, 30)),
  upsellFlag: 'Yes',
  upsellValue: 120000,
  health: 79
}) // renewal window + active upsell pipeline
row({
  name: 'Pinnacle Systems',
  segment: 'Mid-Market',
  arr: 175000,
  am: 'Yuki Tanaka',
  rm: 'Liam Brooks',
  discussion: 'Yes',
  moved: fmtDate(addDays(TODAY, -40)),
  health: 62
}) // active renewal discussion + recently moved
row({
  name: 'Quarrystone Group',
  segment: 'SMB',
  arr: 55000,
  am: 'Owen Clark',
  rm: 'Ingrid Palmer',
  override: 'Yes',
  upsellFlag: 'Yes',
  upsellValue: 30000,
  health: 70
}) // manual override + active upsell pipeline

// ============================================================================
// 3) Flexible/unlocked standalone accounts — volume for the balancer, with
//    a deliberately lopsided starting AM distribution in Enterprise (Nora
//    Ellis holds ~3.5x Marcus Webb's flexible-book ARR) so the rebalance
//    result is obvious to eyeball. Mid-Market and SMB are close to evenly
//    split. Renewal dates, when set, always sit outside the 90-day lock
//    window (100+ days out) so these accounts stay genuinely unlocked.
// ============================================================================

const NAME_STEMS = [
  'Aster', 'Birchwood', 'Cascade', 'Driftwood', 'Elmsworth', 'Fairview', 'Gladstone', 'Harborlight',
  'Ivywood', 'Jasperfield', 'Kestrel', 'Larkspur', 'Maplecrest', 'Northgate', 'Oakhaven', 'Palisade',
  'Quillfeather', 'Ridgeway', 'Silverleaf', 'Thornfield', 'Underwood', 'Valleyview', 'Westbrook', 'Yewgrove'
]
const NAME_SUFFIXES = ['Group', 'Partners', 'Holdings', 'Industries', 'Networks', 'Analytics', 'Solutions', 'Ventures']

function flexAccountName() {
  return uniqueName(`${pick(NAME_STEMS)} ${pick(NAME_SUFFIXES)}`)
}

// Renewal date safely outside the lock window, spread across the next
// 3–15 months so Pass 3's distribution summary has real variation too.
function safeFutureRenewal() {
  if (rand() > 0.25) return '' // most flexible accounts just don't carry a near-term renewal date
  return fmtDate(addDays(TODAY, randInt(100, 450)))
}

function buildFlexibleBatch(segment, count, amWeights, rmWeights) {
  const { am, rm } = REPS[segment]
  const weightedPick = (names, weights) => {
    const r = rand()
    let acc = 0
    for (let i = 0; i < names.length; i++) {
      acc += weights[i]
      if (r <= acc) return names[i]
    }
    return names[names.length - 1]
  }

  for (let i = 0; i < count; i++) {
    const arr = randInt(20, 260) * 1000
    const health = rand() > 0.15 ? randInt(35, 98) : '' // ~15% blank, tests graceful handling
    const upsellValue = rand() > 0.8 ? randInt(5, 60) * 1000 : '' // occasional dormant pipeline, still flag=No
    row({
      name: flexAccountName(),
      segment,
      arr,
      am: weightedPick(am, amWeights),
      rm: weightedPick(rm, rmWeights),
      renewal: safeFutureRenewal(),
      health,
      upsellValue
    })
  }
}

// Enterprise: 18 flexible accounts, AM split ~14/4 (Nora/Marcus) — the
// deliberate imbalance. RM split kept close to even so the imbalance signal
// reads cleanly on one axis.
buildFlexibleBatch('Enterprise', 18, [0.78, 0.22], [0.5, 0.5])

// Mid-Market: 18 flexible accounts, close to evenly split both roles.
buildFlexibleBatch('Mid-Market', 18, [0.55, 0.45], [0.5, 0.5])

// SMB: 18 flexible accounts, close to evenly split both roles.
buildFlexibleBatch('SMB', 18, [0.5, 0.5], [0.55, 0.45])

// --- Write CSV ---------------------------------------------------------
function csvEscape(v) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const headers = Object.keys(rows[0])
const lines = [headers.join(',')]
for (const r of rows) lines.push(headers.map((h) => csvEscape(r[h])).join(','))

fs.writeFileSync(OUT_PATH, lines.join('\n') + '\n')
console.log(`Wrote ${rows.length} rows to ${OUT_PATH}`)

// Quick sanity print: Enterprise AM ARR split, for the imbalance claim.
// (This mirrors "current load" only loosely — it doesn't apply Pass 2's
// fractional-per-member logo/ARR attribution for the inconsistent Vertex
// Holdings group — but it's close enough to confirm the imbalance exists.)
const entAmArr = {}
for (const r of rows) {
  if (r['Customer Segment'] !== 'Enterprise') continue
  const am = r['Account Manager']
  const arr = Number(String(r['Annual Recurring Revenue']).replace(/[$,]/g, ''))
  const isLocked =
    r['Renewal Conversation Active?'] === 'Yes' ||
    r['Upsell Opportunity Open?'] === 'Yes' ||
    r['Do Not Move'] === 'Yes' ||
    r['Book Transfer Date'] !== '' ||
    (r['Next Renewal Date'] &&
      Math.abs((new Date(r['Next Renewal Date']) - TODAY) / 86400000) <= 90)
  entAmArr[am] = entAmArr[am] || { locked: 0, unlocked: 0 }
  entAmArr[am][isLocked ? 'locked' : 'unlocked'] += arr
}
console.log('Enterprise AM current ARR totals (approximate, sanity check):')
for (const [am, v] of Object.entries(entAmArr)) {
  console.log(`  ${am}: locked=$${v.locked.toLocaleString()} unlocked=$${v.unlocked.toLocaleString()} total=$${(v.locked + v.unlocked).toLocaleString()}`)
}
