// Multi-IC "pairing" = the specific combination of reps (one per role, e.g.
// AM + Renewal Manager) assigned together to the same account or group. A
// book with fewer distinct pairings is easier to run — reps already know
// who they're coordinating with. These helpers build a deterministic key
// for a combination and count distinct combinations before/after a rebalance.

export function pairKeyFromRoleMap(roleRepMap) {
  const entries = Object.entries(roleRepMap)
    .filter(([, name]) => name)
    .sort(([a], [b]) => a.localeCompare(b))
  if (entries.length < 2) return null
  return entries.map(([role, name]) => `${role}:${name}`).join('|')
}

function roleMapFromAccount(account) {
  const map = {}
  for (const rep of account.reps) {
    if (rep.name) map[rep.role] = rep.name
  }
  return map
}

// Distinct pairings in the roster as it stands today, one per account row
// (not per group) — a consolidated group's members can carry different
// legacy pairings, and this reflects that reality faithfully.
export function buildCurrentPairing(accounts) {
  const usage = new Map()
  for (const account of accounts) {
    const key = pairKeyFromRoleMap(roleMapFromAccount(account))
    if (!key) continue
    usage.set(key, (usage.get(key) || 0) + 1)
  }
  return { distinctCount: usage.size, usage }
}

// Distinct pairings after a rebalance run: locked groups keep every
// member's existing (possibly inconsistent) pairing untouched; each
// unlocked group is assigned exactly one uniform pairing across all of its
// members, since the whole group moves together.
export function buildAfterPairing(groups, assignments) {
  const usage = new Map()
  for (const group of groups) {
    if (group.locked) {
      for (const account of group.members) {
        const key = pairKeyFromRoleMap(roleMapFromAccount(account))
        if (!key) continue
        usage.set(key, (usage.get(key) || 0) + 1)
      }
    } else {
      const roleMap = assignments.get(group.id)
      if (!roleMap) continue
      const key = pairKeyFromRoleMap(roleMap)
      if (!key) continue
      usage.set(key, (usage.get(key) || 0) + group.members.length)
    }
  }
  return { distinctCount: usage.size, usage }
}

export function isKnownPair(roleRepMap, usage) {
  const key = pairKeyFromRoleMap(roleRepMap)
  if (!key) return false
  return usage.has(key) && usage.get(key) > 0
}

export function describePair(roleRepMap) {
  return Object.entries(roleRepMap)
    .filter(([, name]) => name)
    .map(([role, name]) => `${role}: ${name}`)
    .join(', ')
}
