import { useState } from 'react'
import FileUpload from '../components/FileUpload.jsx'
import FileRequirementsPanel from '../components/FileRequirementsPanel.jsx'
import StepIndicator from '../components/StepIndicator.jsx'
import { getHeaders, parseSpreadsheetFile } from '../lib/fileParser.js'

export default function UploadPage({ onUploaded }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file) => {
    setError('')
    setLoading(true)
    try {
      const rows = await parseSpreadsheetFile(file)
      if (rows.length === 0) {
        throw new Error('The file has no data rows.')
      }
      const headers = getHeaders(rows)
      if (headers.length === 0) {
        throw new Error('Could not find any column headers in the file.')
      }
      onUploaded({ rows, headers, fileName: file.name })
    } catch (err) {
      setError(err.message || 'Something went wrong while processing the file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <StepIndicator current={1} />

      <header className="app-header">
        <h1>Book of Business Rebalancer</h1>
        <p className="subtitle">
          Upload your account roster to consolidate corporate hierarchies and lock down any
          account that shouldn't move — before any rebalancing logic touches your book.
        </p>
      </header>

      <FileRequirementsPanel />

      <section className="upload-section">
        <FileUpload onFile={handleFile} disabled={loading} />
        {loading && <p className="file-status">Processing…</p>}
        {error && <p className="file-error">{error}</p>}
      </section>
    </div>
  )
}
