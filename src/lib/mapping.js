// Central definition of every field role the app understands. Used to drive
// the "What your file needs" panel, the column mapping UI, and validation.

export const REQUIRED_ROLES = [
  {
    key: 'accountName',
    label: 'Account Name',
    description: 'The name of the account / customer.'
  },
  {
    key: 'arr',
    label: 'ARR',
    description: 'Annual recurring revenue for the account, used to size books and consolidated groups.'
  },
  {
    key: 'segment',
    label: 'Segment',
    description: 'Customer segment or tier (e.g. Enterprise, Mid-Market, SMB).'
  }
]

// Rep/owner columns are handled as a dynamic list rather than a single role,
// since a book can carry multiple ICs per account (AM + Renewal Manager,
// for example). At least one is required.
export const REP_ROLE = {
  key: 'reps',
  label: 'Owner / Rep',
  description:
    'The rep who owns the account. Map more than one column if accounts carry multiple ICs (e.g. an AM column and a separate Renewal Manager column).'
}

export const OPTIONAL_ROLES = [
  {
    key: 'parentId',
    label: 'Parent / Ultimate Parent ID',
    enables: 'Hierarchy consolidation — child accounts are grouped and rolled up under one parent logo.',
    missing: 'No hierarchy column mapped — accounts will be treated individually, not grouped.'
  },
  {
    key: 'renewalDate',
    label: 'Renewal Date',
    enables: 'Locks accounts with a renewal date landing inside your configured window.',
    missing: 'No renewal date mapped — the renewal-window lock rule will never trigger.'
  },
  {
    key: 'activeRenewalDiscussion',
    label: 'Active Renewal Discussion Flag',
    enables: 'Locks accounts currently in a live renewal conversation, regardless of renewal date.',
    missing: 'No renewal-discussion flag mapped — that lock rule will never trigger.'
  },
  {
    key: 'activeUpsellPipeline',
    label: 'Active Upsell Pipeline Flag',
    enables: 'Locks accounts with open upsell/expansion pipeline so a rep transfer can’t interrupt a deal.',
    missing: 'No upsell-pipeline flag mapped — that lock rule will never trigger.'
  },
  {
    key: 'upsellPipelineValue',
    label: 'Upsell / Expansion Pipeline ($)',
    enables: 'Used as a balancing metric — spreads open pipeline dollars evenly across reps when rebalancing (Pass 2).',
    missing: 'No pipeline dollar amount mapped — that balancing metric is excluded from rebalancing, not treated as zero.'
  },
  {
    key: 'recentlyMoved',
    label: 'Recently Moved Date',
    enables: 'Locks accounts that changed owners recently, protecting ramp time on a new relationship.',
    missing: 'No recently-moved date mapped — that lock rule will never trigger.'
  },
  {
    key: 'manualOverride',
    label: 'Manual Override Flag',
    enables: 'Locks any account flagged by hand, regardless of every other rule.',
    missing: 'No manual override flag mapped — accounts can only be locked by the automatic rules above.'
  },
  {
    key: 'healthScore',
    label: 'Customer Health Score',
    enables: 'Shown for context, and available as a balancing metric (Pass 2) if numeric. Never used to lock accounts.',
    missing: 'No health score mapped — the report omits it, and it drops out of balancing.'
  }
]

export function getDistinctValues(rows, column, limit = 500) {
  if (!column) return []
  const set = new Set()
  for (const row of rows) {
    const v = row[column]
    if (v !== '' && v != null) set.add(String(v).trim())
    if (set.size > limit) break
  }
  return Array.from(set)
}
