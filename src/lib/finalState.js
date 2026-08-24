import { primarySegmentOf } from './balancing.js'

// Everything in this file resolves "who owns this, going forward" for a
// single account (member) or a whole group, honoring manual overrides on
// top of Pass 2's algorithmic assignment, with a clean fallback to the
// current owner wherever nothing reassigned it (locked groups, or a role
// with no candidate reps in its pool). That one fallback rule is what lets
// every function below treat locked and unlocked groups uniformly instead
// of special-casing lock status everywhere.

function ownRepName(member, role) {
  const rep = member.reps.find((r) => r.role === role && r.name)
  return rep ? rep.name : null
}

// overrides: { [groupId]: { [role]: repName } }
function resolvedRep(group, role, assignments, overrides) {
  if (group.locked) return null
  const rep = overrides[group.id]?.[role] ?? assignments.get(group.id)?.[role]
  return rep || null
}

// The rep every member of `group` carries for `role`, going forward. For an
// unlocked group with a resolved assignment/override, that's one uniform
// rep for the whole group (the point of rebalancing). Otherwise it falls
// back to each member's own current rep, which naturally reproduces
// whatever inconsistency already existed in the data.
export function finalOwnerForMember(group, member, role, assignments, overrides) {
  const resolved = resolvedRep(group, role, assignments, overrides)
  if (resolved) return resolved
  return ownRepName(member, role)
}

export function preOwnerForMember(member, role) {
  return ownRepName(member, role)
}

// Single-string labels for the group as a whole, matching Pass 1's
// convention of joining multiple distinct names when a group's members
// don't already agree on one owner for a role.
export function groupCurrentOwnerLabel(group, role) {
  const rep = group.reps.find((r) => r.role === role)
  return rep ? rep.name : ''
}

export function groupFinalOwnerLabel(group, role, assignments, overrides) {
  const resolved = resolvedRep(group, role, assignments, overrides)
  return resolved || groupCurrentOwnerLabel(group, role)
}

export function isEligibleForOverride(group, assignments) {
  return !group.locked && assignments.has(group.id)
}

// --- Final assignment list -------------------------------------------------

export function buildAssignmentList(groups, repRoles, assignments, overrides) {
  return groups.map((group) => {
    const perRole = repRoles.map((role) => {
      const from = groupCurrentOwnerLabel(group, role)
      const to = groupFinalOwnerLabel(group, role, assignments, overrides)
      return { role, from, to, changed: !group.locked && from !== to }
    })
    return {
      groupId: group.id,
      displayName: group.displayName,
      isConsolidated: group.isConsolidated,
      memberCount: group.members.length,
      segment: primarySegmentOf(group),
      arr: group.arr,
      locked: group.locked,
      perRole,
      changed: perRole.some((r) => r.changed),
      isOverridden: Boolean(overrides[group.id] && Object.keys(overrides[group.id]).length > 0),
      eligibleForOverride: isEligibleForOverride(group, assignments)
    }
  })
}

// --- Change / stability report ---------------------------------------------

// Gained/lost/unchanged are attributed per member (each member has exactly
// one pre-existing rep per role, however inconsistent the group as a whole
// is), with logo credit split fractionally across a group's members so
// every group's total logo credit still sums to exactly 1 — the same
// convention Pass 2 uses for load, applied here to the final state instead.
export function buildChangeStats(groups, repRoles, assignments, overrides) {
  const byRole = {}
  for (const role of repRoles) {
    const stats = new Map()
    const ensure = (rep) => {
      if (!stats.has(rep)) {
        stats.set(rep, { unchangedCount: 0, lostCount: 0, gainedCount: 0, unchangedARR: 0, lostARR: 0, gainedARR: 0 })
      }
      return stats.get(rep)
    }

    for (const group of groups) {
      const logoCredit = 1 / group.members.length
      for (const member of group.members) {
        const pre = preOwnerForMember(member, role)
        const final = finalOwnerForMember(group, member, role, assignments, overrides)
        if (pre && pre === final) {
          const s = ensure(pre)
          s.unchangedCount += logoCredit
          s.unchangedARR += member.arr
        } else {
          if (pre) {
            const s = ensure(pre)
            s.lostCount += logoCredit
            s.lostARR += member.arr
          }
          if (final) {
            const s = ensure(final)
            s.gainedCount += logoCredit
            s.gainedARR += member.arr
          }
        }
      }
    }

    byRole[role] = stats
  }
  return byRole
}

// Percentages are relative to each rep's PRE-rebalance book (unchanged +
// lost), for count and ARR alike — one consistent denominator for all
// three figures. "Gained %" can exceed 100% for a rep who had very little
// before and picked up a lot; that's a real signal, not a bug.
export function summarizeChangeStats(byRole) {
  const result = {}
  for (const [role, statsMap] of Object.entries(byRole)) {
    const pct = (n, d) => (d > 0 ? (n / d) * 100 : null)
    result[role] = Array.from(statsMap.entries())
      .map(([rep, s]) => {
        const preBookCount = s.unchangedCount + s.lostCount
        const preBookARR = s.unchangedARR + s.lostARR
        return {
          rep,
          ...s,
          preBookCount,
          preBookARR,
          unchangedPctCount: pct(s.unchangedCount, preBookCount),
          lostPctCount: pct(s.lostCount, preBookCount),
          gainedPctCount: pct(s.gainedCount, preBookCount),
          unchangedPctArr: pct(s.unchangedARR, preBookARR),
          lostPctArr: pct(s.lostARR, preBookARR),
          gainedPctArr: pct(s.gainedARR, preBookARR)
        }
      })
      .sort((a, b) => a.rep.localeCompare(b.rep))
  }
  return result
}

// --- Distribution summary (logos + renewal workload by month/quarter) -----

function monthBuckets(today, count) {
  const buckets = []
  for (let i = 0; i < count; i++) {
    const start = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const end = new Date(today.getFullYear(), today.getMonth() + i + 1, 0)
    buckets.push({ label: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), start, end })
  }
  return buckets
}

function quarterBuckets(today, count) {
  const qStartMonth = Math.floor(today.getMonth() / 3) * 3
  const buckets = []
  for (let i = 0; i < count; i++) {
    const start = new Date(today.getFullYear(), qStartMonth + i * 3, 1)
    const end = new Date(today.getFullYear(), qStartMonth + i * 3 + 3, 0)
    const q = Math.floor(start.getMonth() / 3) + 1
    buckets.push({ label: `Q${q} ${start.getFullYear()}`, start, end })
  }
  return buckets
}

function inBucket(date, bucket) {
  return date >= bucket.start && date <= bucket.end
}

export function buildDistributionSummary(groups, repRoles, assignments, overrides, today = new Date()) {
  const months = monthBuckets(today, 12)
  const quarters = quarterBuckets(today, 4)
  const byRole = {}

  for (const role of repRoles) {
    const reps = new Map()
    const ensure = (rep) => {
      if (!reps.has(rep)) {
        reps.set(rep, {
          rep,
          logos: 0,
          monthly: months.map((b) => ({ ...b, renewals: 0, arr: 0 })),
          quarterly: quarters.map((b) => ({ ...b, renewals: 0, arr: 0 }))
        })
      }
      return reps.get(rep)
    }

    for (const group of groups) {
      const logoCredit = 1 / group.members.length
      for (const member of group.members) {
        const owner = finalOwnerForMember(group, member, role, assignments, overrides)
        if (!owner) continue
        const row = ensure(owner)
        row.logos += logoCredit
        if (member.renewalDate) {
          const mb = row.monthly.find((b) => inBucket(member.renewalDate, b))
          if (mb) {
            mb.renewals += 1
            mb.arr += member.arr
          }
          const qb = row.quarterly.find((b) => inBucket(member.renewalDate, b))
          if (qb) {
            qb.renewals += 1
            qb.arr += member.arr
          }
        }
      }
    }

    byRole[role] = { reps: Array.from(reps.values()).sort((a, b) => a.rep.localeCompare(b.rep)), months, quarters }
  }

  return byRole
}
