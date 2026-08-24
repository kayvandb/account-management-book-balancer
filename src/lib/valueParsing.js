// Small, forgiving parsers for values coming out of arbitrary customer
// spreadsheets, where "true" might be TRUE, Yes, Y, 1, or an "x".

const TRUTHY = new Set(['true', 'yes', 'y', '1', 'x', 'checked', 'active', 'open'])
const FALSY = new Set(['false', 'no', 'n', '0', '', 'closed', 'inactive'])

export function parseBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (value == null) return false
  const norm = String(value).trim().toLowerCase()
  if (TRUTHY.has(norm)) return true
  if (FALSY.has(norm)) return false
  return false
}

export function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (value == null) return 0
  const cleaned = String(value).replace(/[$,\s]/g, '').replace(/^\((.*)\)$/, '-$1')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

// Like parseNumber, but distinguishes "not a number" (null) from a real
// zero — used for metrics like health score where a blank/non-numeric cell
// should be excluded from an average or sum, not treated as 0.
export function parseNumericOrNull(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value == null) return null
  const cleaned = String(value).replace(/[$,%\s]/g, '').replace(/^\((.*)\)$/, '-$1')
  if (cleaned === '') return null
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

// Excel serial date epoch (1899-12-30) — used when a numeric date slips
// through as a raw serial instead of being converted by the xlsx reader.
function excelSerialToDate(serial) {
  const ms = Math.round((serial - 25569) * 86400 * 1000)
  return new Date(ms)
}

export function parseDateValue(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    const d = excelSerialToDate(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const str = String(value).trim()
  if (!str) return null
  const direct = new Date(str)
  if (!Number.isNaN(direct.getTime())) return direct
  // Fallback for MM/DD/YYYY or M/D/YY style strings.
  const match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (match) {
    let [, m, d, y] = match
    if (y.length === 2) y = `20${y}`
    const d2 = new Date(Number(y), Number(m) - 1, Number(d))
    if (!Number.isNaN(d2.getTime())) return d2
  }
  return null
}

export function daysBetween(dateA, dateB) {
  const MS_PER_DAY = 86400 * 1000
  const a = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate())
  const b = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate())
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY)
}

export function formatDate(date) {
  if (!date) return ''
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function cleanString(value) {
  if (value == null) return ''
  return String(value).trim()
}
