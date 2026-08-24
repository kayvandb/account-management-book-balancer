import { computeAccountLock, REASON_LABELS } from './locking.js'

// Groups normalized accounts by their ultimate-parent key. A bucket only
// counts as a "consolidated group" once it has 2+ members — a parent key
// referenced by exactly one row doesn't merge with anything, so it's left
// standing as its own single-account group.
function buildBuckets(accounts) {
  const byParent = new Map()
  const standalone = []

  for (const account of accounts) {
    if (account.parentKey) {
      const key = account.parentKey.toLowerCase()
      if (!byParent.has(key)) byParent.set(key, { rawKey: account.parentKey, members: [] })
      byParent.get(key).members.push(account)
    } else {
      standalone.push(account)
    }
  }

  const consolidatedBuckets = []
  for (const bucket of byParent.values()) {
    if (bucket.members.length >= 2) {
      consolidatedBuckets.push(bucket)
    } else {
      standalone.push(bucket.members[0])
    }
  }

  return { consolidatedBuckets, standalone }
}

function mergeReps(members) {
  const byRole = new Map()
  for (const member of members) {
    for (const rep of member.reps) {
      if (!byRole.has(rep.role)) byRole.set(rep.role, new Set())
      byRole.get(rep.role).add(rep.name)
    }
  }
  return Array.from(byRole.entries()).map(([role, names]) => ({
    role,
    name: Array.from(names).join(', ')
  }))
}

function groupDisplayName(bucket) {
  const parentRow = bucket.members.find(
    (m) => m.accountName.trim().toLowerCase() === bucket.rawKey.trim().toLowerCase()
  )
  return parentRow ? parentRow.accountName : bucket.rawKey
}

function mergeReasons(memberLocks) {
  const byType = new Map()
  for (const { account, lock } of memberLocks) {
    for (const reason of lock.reasons) {
      if (!byType.has(reason.type)) {
        byType.set(reason.type, { type: reason.type, label: reason.label, accounts: [] })
      }
      byType.get(reason.type).accounts.push({ name: account.accountName, detail: reason.detail })
    }
  }
  return Array.from(byType.values())
}

// Builds the full report: consolidated groups + standalone accounts, each
// with locking already evaluated, plus summary stats for the header cards.
export function buildReport(accounts, settings, today = new Date()) {
  const { consolidatedBuckets, standalone } = buildBuckets(accounts)

  const consolidatedGroups = consolidatedBuckets.map((bucket, i) => {
    const memberLocks = bucket.members.map((account) => ({
      account,
      lock: computeAccountLock(account, settings, today)
    }))
    const locked = memberLocks.some((m) => m.lock.locked)
    const segments = Array.from(new Set(bucket.members.map((m) => m.segment)))

    return {
      id: `group-${i}`,
      isConsolidated: true,
      displayName: groupDisplayName(bucket),
      parentKey: bucket.rawKey,
      members: bucket.members,
      memberLocks,
      arr: bucket.members.reduce((sum, m) => sum + m.arr, 0),
      segments,
      reps: mergeReps(bucket.members),
      locked,
      reasons: mergeReasons(memberLocks)
    }
  })

  const standaloneGroups = standalone.map((account) => {
    const lock = computeAccountLock(account, settings, today)
    return {
      id: `single-${account.id}`,
      isConsolidated: false,
      displayName: account.accountName,
      parentKey: null,
      members: [account],
      memberLocks: [{ account, lock }],
      arr: account.arr,
      segments: [account.segment],
      reps: account.reps.map((r) => ({ role: r.role, name: r.name })),
      locked: lock.locked,
      reasons: lock.reasons.map((r) => ({ type: r.type, label: r.label, accounts: [{ name: account.accountName, detail: r.detail }] }))
    }
  })

  const groups = [...consolidatedGroups, ...standaloneGroups].sort((a, b) => b.arr - a.arr)

  const accountsFolded = consolidatedGroups.reduce((sum, g) => sum + g.members.length, 0)

  const reasonCounts = {}
  for (const type of Object.keys(REASON_LABELS)) reasonCounts[type] = 0
  for (const group of groups) {
    if (!group.locked) continue
    for (const reason of group.reasons) {
      reasonCounts[reason.type] += 1
    }
  }

  const lockedCount = groups.filter((g) => g.locked).length

  return {
    groups,
    stats: {
      totalRawAccounts: accounts.length,
      totalGroups: groups.length,
      consolidatedGroupCount: consolidatedGroups.length,
      accountsFolded,
      lockedCount,
      unlockedCount: groups.length - lockedCount,
      reasonCounts
    }
  }
}
