import { availableMetrics, normalizeWeights } from './metrics.js'
import { pairKeyFromRoleMap, buildCurrentPairing, buildAfterPairing, isKnownPair } from './pairing.js'

export const DEFAULT_TOLERANCE_PERCENT = 5

// A consolidated group can span more than one segment if its member
// accounts disagree (rare, but the mapped segment column is per-account).
// The group is balanced as a single unit, so it needs one segment — the
// one carrying the most ARR among its members.
function primarySegmentOf(group) {
  if (group.segments.length <= 1) return group.segments[0] || 'Unspecified'
  const arrBySegment = new Map()
  for (const m of group.members) {
    arrBySegment.set(m.segment, (arrBySegment.get(m.segment) || 0) + m.arr)
  }
  let best = group.segments[0]
  let bestArr = -1
  for (const [seg, arr] of arrBySegment) {
    if (arr > bestArr) {
      bestArr = arr
      best = seg
    }
  }
  return best
}

function distinctRepNamesForRole(group, role) {
  const set = new Set()
  for (const member of group.members) {
    for (const rep of member.reps) {
      if (rep.role === role && rep.name) set.add(rep.name)
    }
  }
  return Array.from(set)
}

function zeroMetricRow(metrics) {
  return Object.fromEntries(metrics.map((m) => [m.key, 0]))
}

function addContribution(row, metrics, group, today) {
  for (const metric of metrics) {
    row[metric.key] += metric.groupContribution(group, today)
  }
}

// A consolidated group's *current* ownership can be inconsistent across
// members (that's exactly the messy state consolidation exists to clean
// up) — crediting every distinct current owner the group's full total
// would double- (or triple-, or quadruple-) count it. Instead, each
// member's own contribution is credited only to its own current rep for
// this role, with logo count split fractionally across members so a
// group's total logo credit still always sums to exactly 1.
function addCurrentMemberContributions(loadByRep, metrics, group, role, today) {
  const memberCount = group.members.length
  for (const member of group.members) {
    const ownerNames = member.reps.filter((r) => r.role === role && r.name).map((r) => r.name)
    if (ownerNames.length === 0) continue
    const pseudoGroup = { members: [member], arr: member.arr }
    for (const ownerName of ownerNames) {
      const row = loadByRep.get(ownerName)
      if (!row) continue
      for (const metric of metrics) {
        row[metric.key] += metric.key === 'logoCount' ? 1 / memberCount : metric.groupContribution(pseudoGroup, today)
      }
    }
  }
}

// Higher = this rep is further below their fair-share target, weighted
// across metrics. Each metric's gap is expressed as a fraction of its own
// target (e.g. -0.4 = 40% under target) so metrics on very different
// scales (dollars vs. logo counts) contribute comparably once weighted.
function weightedDeficitScore(repRow, targets, weights, metrics) {
  let score = 0
  for (const metric of metrics) {
    const target = targets[metric.key]
    if (!target || target <= 0) continue
    const current = repRow[metric.key] || 0
    const relativeDeficit = (target - current) / target
    score += (weights[metric.key] || 0) * relativeDeficit
  }
  return score
}

// Bounded cartesian product across per-role candidate lists, capped so the
// search stays cheap even with several rep roles mapped.
function cappedCombos(candidateLists, cap) {
  const roles = Object.keys(candidateLists)
  let combos = [{}]
  for (const role of roles) {
    const next = []
    outer: for (const combo of combos) {
      for (const candidate of candidateLists[role]) {
        next.push({ ...combo, [role]: candidate })
        if (next.length >= cap) break outer
      }
    }
    combos = next
  }
  return combos
}

/**
 * Runs the weighted greedy rebalance for every segment/role pool.
 *
 * report        Pass 1's { groups, stats } output (locking already applied)
 * accounts      normalized accounts (used only to check metric availability)
 * mapping       the column mapping (used only to check metric availability)
 * repRoles      distinct role labels across all mapped rep columns
 * weights       { [metricKey]: 0-100 } raw slider values
 * tolerancePercent  how close (in percentage points of weighted deficit
 *                   score) a reused pairing must be to the best pure-balance
 *                   combo to be preferred over it
 */
export function runBalance({ report, accounts, mapping, repRoles, weights, tolerancePercent = DEFAULT_TOLERANCE_PERCENT, today = new Date() }) {
  const metrics = availableMetrics(mapping, accounts)
  const normWeights = normalizeWeights(weights, metrics)
  const tolerance = Math.max(0, tolerancePercent) / 100

  const groups = report.groups
  const segments = Array.from(new Set(groups.map(primarySegmentOf)))

  // byRole[role][segment] = { reps, targets, poolTotals, beforeLoad, afterLoad }
  const byRole = {}

  for (const role of repRoles) {
    byRole[role] = {}
    for (const segment of segments) {
      const segGroups = groups.filter((g) => primarySegmentOf(g) === segment)
      const repSet = new Set()
      for (const g of segGroups) {
        for (const name of distinctRepNamesForRole(g, role)) repSet.add(name)
      }
      const reps = Array.from(repSet).sort()

      const poolTotals = zeroMetricRow(metrics)
      const beforeLoad = new Map(reps.map((r) => [r, zeroMetricRow(metrics)]))
      const afterLoad = new Map(reps.map((r) => [r, zeroMetricRow(metrics)])) // starts as locked-only baseline

      for (const g of segGroups) {
        addContribution(poolTotals, metrics, g, today)
        addCurrentMemberContributions(beforeLoad, metrics, g, role, today)
        if (g.locked) addCurrentMemberContributions(afterLoad, metrics, g, role, today)
      }

      const targets = {}
      for (const metric of metrics) {
        targets[metric.key] = reps.length > 0 ? poolTotals[metric.key] / reps.length : 0
      }

      byRole[role][segment] = { reps, targets, poolTotals, beforeLoad, afterLoad }
    }
  }

  // Seed pairing-reuse knowledge from the roster as it stands today, so the
  // very first assignment can already prefer an existing combination.
  const beforePairing = buildCurrentPairing(accounts)
  const runningPairUsage = new Map(beforePairing.usage)

  const assignments = new Map() // group.id -> { role: repName }
  const assignmentLog = [] // ordered, inspectable record of every decision
  const K = repRoles.length <= 2 ? 6 : 3
  const COMBO_CAP = 200

  for (const segment of segments) {
    const unlockedGroups = groups
      .filter((g) => !g.locked && primarySegmentOf(g) === segment)
      .sort((a, b) => b.arr - a.arr) // larger ARR/logo-impact groups first

    for (const group of unlockedGroups) {
      const roleCandidates = {}
      for (const role of repRoles) {
        const data = byRole[role][segment]
        if (!data || data.reps.length === 0) continue
        const scored = data.reps
          .map((rep) => ({ rep, score: weightedDeficitScore(data.afterLoad.get(rep), data.targets, normWeights, metrics) }))
          .sort((a, b) => b.score - a.score)
        roleCandidates[role] = scored.slice(0, K)
      }

      const rolesToAssign = Object.keys(roleCandidates)
      if (rolesToAssign.length === 0) {
        assignmentLog.push({ groupId: group.id, groupName: group.displayName, segment, roleMap: {}, reusedPairing: false, note: 'No rep pool available for any role in this segment.' })
        continue
      }

      let chosenRoleMap
      let reusedPairing = false

      if (rolesToAssign.length === 1) {
        const role = rolesToAssign[0]
        chosenRoleMap = { [role]: roleCandidates[role][0].rep }
      } else {
        const candidateLists = Object.fromEntries(rolesToAssign.map((r) => [r, roleCandidates[r]]))
        const combos = cappedCombos(candidateLists, COMBO_CAP)
        const roleMapOf = (combo) => Object.fromEntries(rolesToAssign.map((r) => [r, combo[r].rep]))
        const scoredCombos = combos
          .map((combo) => ({ combo, roleMap: roleMapOf(combo), score: rolesToAssign.reduce((sum, r) => sum + combo[r].score, 0) }))
          .sort((a, b) => b.score - a.score)

        const best = scoredCombos[0]
        const reused = scoredCombos.find(
          (c) => isKnownPair(c.roleMap, runningPairUsage) && best.score - c.score <= tolerance
        )
        const chosen = reused || best
        chosenRoleMap = chosen.roleMap
        reusedPairing = Boolean(reused)
      }

      for (const role of rolesToAssign) {
        const rep = chosenRoleMap[role]
        addContribution(byRole[role][segment].afterLoad.get(rep), metrics, group, today)
      }
      assignments.set(group.id, chosenRoleMap)

      const pairKey = pairKeyFromRoleMap(chosenRoleMap)
      if (pairKey) runningPairUsage.set(pairKey, (runningPairUsage.get(pairKey) || 0) + 1)

      assignmentLog.push({
        groupId: group.id,
        groupName: group.displayName,
        segment,
        arr: group.arr,
        roleMap: chosenRoleMap,
        reusedPairing
      })
    }
  }

  const afterPairing = buildAfterPairing(groups, assignments)

  return {
    metrics,
    weights: normWeights,
    segments,
    byRole,
    assignments,
    assignmentLog,
    pairing: { before: beforePairing, after: afterPairing }
  }
}

export { primarySegmentOf }
