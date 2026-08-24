import StepIndicator from '../components/StepIndicator.jsx'
import SettingsPanel from '../components/SettingsPanel.jsx'
import SummaryStats from '../components/SummaryStats.jsx'
import LockReportTable from '../components/LockReportTable.jsx'

export default function ReportPage({ report, mapping, fileName, rowCount, settings, onSettingsChange, onBack, onContinue }) {
  return (
    <div className="app">
      <StepIndicator current={3} />

      <button type="button" className="back-link" onClick={onBack}>
        ← Back to mapping
      </button>

      <header className="app-header">
        <h1>Locking report</h1>
        <p className="subtitle">
          <strong>{fileName}</strong> — {rowCount.toLocaleString()} accounts uploaded. Review
          consolidation and locking results below before rebalancing.
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
        onChange={onSettingsChange}
        hasRenewalDate={Boolean(mapping.renewalDate)}
        hasRecentlyMoved={Boolean(mapping.recentlyMoved)}
      />

      <SummaryStats stats={report.stats} />

      <LockReportTable groups={report.groups} />

      <div className="config-actions">
        <button type="button" className="secondary-btn" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="export-btn" onClick={onContinue}>
          Continue to Balancing →
        </button>
      </div>
    </div>
  )
}
