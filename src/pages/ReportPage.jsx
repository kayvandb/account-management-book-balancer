import { useMemo, useState } from 'react'
import StepIndicator from '../components/StepIndicator.jsx'
import SettingsPanel from '../components/SettingsPanel.jsx'
import SummaryStats from '../components/SummaryStats.jsx'
import LockReportTable from '../components/LockReportTable.jsx'
import { normalizeAccounts } from '../lib/normalize.js'
import { buildReport } from '../lib/consolidation.js'
import { DEFAULT_SETTINGS } from '../lib/locking.js'

export default function ReportPage({ rows, mapping, repColumns, fileName, onBack }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const accounts = useMemo(() => normalizeAccounts(rows, mapping, repColumns), [rows, mapping, repColumns])
  const report = useMemo(() => buildReport(accounts, settings), [accounts, settings])

  return (
    <div className="app">
      <StepIndicator current={3} />

      <button type="button" className="back-link" onClick={onBack}>
        ← Back to mapping
      </button>

      <header className="app-header">
        <h1>Locking report</h1>
        <p className="subtitle">
          <strong>{fileName}</strong> — {rows.length.toLocaleString()} accounts uploaded. Review
          consolidation and locking results below before any rebalancing logic runs (coming in a
          later pass).
        </p>
      </header>

      {mapping.parentId ? (
        <div className="consolidation-banner">
          🏢 {report.stats.accountsFolded} accounts consolidated into{' '}
          {report.stats.consolidatedGroupCount} parent group
          {report.stats.consolidatedGroupCount === 1 ? '' : 's'}.
        </div>
      ) : (
        <div className="consolidation-banner neutral">
          No hierarchy column was mapped — every account is being treated individually.
        </div>
      )}

      <SettingsPanel
        settings={settings}
        onChange={setSettings}
        hasRenewalDate={Boolean(mapping.renewalDate)}
        hasRecentlyMoved={Boolean(mapping.recentlyMoved)}
      />

      <SummaryStats stats={report.stats} />

      <LockReportTable groups={report.groups} />
    </div>
  )
}
