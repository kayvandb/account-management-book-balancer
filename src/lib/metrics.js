import { daysBetween } from './valueParsing.js'

// The six load metrics the balancing engine can weight. Each knows how to
// tell whether it's usable for a given mapping (so the UI can gray it out
// rather than silently pretending an unmapped column is all zeros), and how
// to compute one consolidated group's contribution to that metric.
//
// "Renewals per month/quarter" use fixed 30/90-day rolling windows from
// today — a literal calendar month/quarter — independent of the Pass 1
// locking windows, which are a separate, user-adjustable concept.
const RENEWALS_PER_MONTH_DAYS = 30
const RENEWALS_PER_QUARTER_DAYS = 90

function renewalsWithin(group, windowDays, today) {
  return group.members.filter((m) => {
    if (!m.renewalDate) return false
    const diff = daysBetween(m.renewalDate, today)
    return diff >= 0 && diff <= windowDays
  }).length
}

export const METRICS = [
  {
    key: 'logoCount',
    label: 'Logo count',
    shortLabel: 'Logos',
    format: 'integer',
    isAvailable: () => true,
    groupContribution: () => 1
  },
  {
    key: 'arr',
    label: 'ARR',
    shortLabel: 'ARR',
    format: 'currency',
    isAvailable: () => true,
    groupContribution: (group) => group.arr
  },
  {
    key: 'renewalsPerMonth',
    label: 'Renewals per month',
    shortLabel: 'Renewals/mo',
    format: 'integer',
    isAvailable: (mapping) => Boolean(mapping.renewalDate),
    groupContribution: (group, today) => renewalsWithin(group, RENEWALS_PER_MONTH_DAYS, today)
  },
  {
    key: 'renewalsPerQuarter',
    label: 'Renewals per quarter',
    shortLabel: 'Renewals/qtr',
    format: 'integer',
    isAvailable: (mapping) => Boolean(mapping.renewalDate),
    groupContribution: (group, today) => renewalsWithin(group, RENEWALS_PER_QUARTER_DAYS, today)
  },
  {
    key: 'upsellPipelineValue',
    label: 'Upsell / expansion pipeline $',
    shortLabel: 'Upsell $',
    format: 'currency',
    isAvailable: (mapping, accounts) =>
      Boolean(mapping.upsellPipelineValue) && accounts.some((a) => a.upsellPipelineValue != null),
    groupContribution: (group) =>
      group.members.reduce((sum, m) => sum + (m.upsellPipelineValue || 0), 0)
  },
  {
    key: 'healthScore',
    label: 'Customer health score',
    shortLabel: 'Health',
    format: 'decimal',
    isAvailable: (mapping, accounts) =>
      Boolean(mapping.healthScore) && accounts.some((a) => a.healthScoreValue != null),
    groupContribution: (group) =>
      group.members.reduce((sum, m) => sum + (m.healthScoreValue || 0), 0)
  }
]

export function availableMetrics(mapping, accounts) {
  return METRICS.filter((m) => m.isAvailable(mapping, accounts))
}

export const DEFAULT_WEIGHTS = Object.fromEntries(METRICS.map((m) => [m.key, 50]))

// Normalizes raw 0-100 weight sliders to fractions that sum to 1 across
// only the metrics actually available for this roster. Falls back to an
// equal split if every available weight was zeroed out.
export function normalizeWeights(rawWeights, metrics) {
  const total = metrics.reduce((sum, m) => sum + Math.max(0, rawWeights[m.key] || 0), 0)
  if (total <= 0) {
    const equal = metrics.length ? 1 / metrics.length : 0
    return Object.fromEntries(metrics.map((m) => [m.key, equal]))
  }
  return Object.fromEntries(metrics.map((m) => [m.key, Math.max(0, rawWeights[m.key] || 0) / total]))
}

export function formatMetricValue(metric, value) {
  const v = value || 0
  if (metric.format === 'currency') {
    return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  }
  if (metric.format === 'decimal') {
    return v.toLocaleString('en-US', { maximumFractionDigits: 1 })
  }
  return Math.round(v).toLocaleString('en-US')
}
