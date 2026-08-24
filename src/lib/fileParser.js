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
