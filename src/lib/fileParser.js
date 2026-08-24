import * as XLSX from 'xlsx'

// Reads an uploaded .xlsx/.xls/.csv file and returns an array of plain
// objects keyed by the header row of the first sheet.
export function parseSpreadsheetFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = (event) => {
      try {
        const data = event.target.result
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          reject(new Error('The file has no sheets.'))
          return
        }
        const sheet = workbook.Sheets[firstSheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        resolve(rows)
      } catch (err) {
        reject(new Error('Could not parse the file. Make sure it is a valid .xlsx or .csv file.'))
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

export function getHeaders(rows) {
  if (!rows || rows.length === 0) return []
  const headers = new Set()
  // Scan more than just row 0 in case some rows have sparse columns.
  for (const row of rows.slice(0, 50)) {
    Object.keys(row).forEach((k) => headers.add(k))
  }
  return Array.from(headers)
}

// Builds a CSV string from an array of plain objects, in the given
// header/key order.
export function toCsv(rows, columns) {
  const escape = (value) => {
    const str = value == null ? '' : String(value)
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }
  const header = columns.map((c) => escape(c.label)).join(',')
  const lines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(','))
  return [header, ...lines].join('\n')
}

export function downloadCsv(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

// Multi-sheet .xlsx export — sheets is an array of { name, rows: [plainObj, ...] }.
export function downloadWorkbook(sheets, filename) {
  const workbook = XLSX.utils.book_new()
  for (const sheet of sheets) {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31))
  }
  XLSX.writeFile(workbook, filename)
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
