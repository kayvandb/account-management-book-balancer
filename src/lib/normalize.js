import { parseBoolean, parseDateValue, parseNumber, cleanString } from './valueParsing.js'

// Turns raw spreadsheet rows into normalized account objects using the
// user's column mapping. repColumns is an array of { id, label, column }.
export function normalizeAccounts(rawRows, mapping, repColumns) {
  return rawRows.map((row, index) => {
    const reps = repColumns
      .filter((rc) => rc.column)
      .map((rc) => ({ role: rc.label || rc.column, name: cleanString(row[rc.column]) }))
      .filter((r) => r.name)

    const parentIdRaw = mapping.parentId ? cleanString(row[mapping.parentId]) : ''

    return {
      id: index,
      accountName: cleanString(row[mapping.accountName]) || `(unnamed account #${index + 1})`,
      arr: parseNumber(row[mapping.arr]),
      segment: cleanString(row[mapping.segment]) || 'Unspecified',
      reps,
      parentKey: parentIdRaw || null,
      renewalDate: mapping.renewalDate ? parseDateValue(row[mapping.renewalDate]) : null,
      activeRenewalDiscussion: mapping.activeRenewalDiscussion
        ? parseBoolean(row[mapping.activeRenewalDiscussion])
        : false,
      activeUpsellPipeline: mapping.activeUpsellPipeline
        ? parseBoolean(row[mapping.activeUpsellPipeline])
        : false,
      recentlyMovedDate: mapping.recentlyMoved ? parseDateValue(row[mapping.recentlyMoved]) : null,
      manualOverride: mapping.manualOverride ? parseBoolean(row[mapping.manualOverride]) : false,
      healthScore: mapping.healthScore ? cleanString(row[mapping.healthScore]) : ''
    }
  })
}
