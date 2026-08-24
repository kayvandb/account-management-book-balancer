import { useMemo } from 'react'
import StepIndicator from '../components/StepIndicator.jsx'
import BalanceSettingsPanel from '../components/BalanceSettingsPanel.jsx'
import BalanceResultsTable from '../components/BalanceResultsTable.jsx'
import PairingSummary from '../components/PairingSummary.jsx'
import BalanceAssignmentsTable from '../components/BalanceAssignmentsTable.jsx'

export default function BalancePage({
  report,
  accounts,
  mapping,
  repColumns,
  balance,
  weights,
  onWeightsChange,
  tolerancePercent,
  onToleranceChange,
  fileName,
  onBack,
  onContinue
}) {
  const repRoles = useMemo(
    () => Array.from(new Set(repColumns.map((rc) => rc.label || rc.column))),
    [repColumns]
  )

  const unlockedCount = report.stats.unlockedCount

  return (
    <div className="app">
      <StepIndicator current={4} />

      <button type="button" className="back-link" onClick={onBack}>
        ← Back to locking report
      </button>

      <header className="app-header">
        <h1>Rebalance</h1>
        <p className="subtitle">
          <strong>{fileName}</strong> — distributing {unlockedCount.toLocaleString()} unlocked
          account{unlockedCount === 1 ? '' : 's'}/group{unlockedCount === 1 ? '' : 's'} across each
          segment's reps. Locked accounts stay exactly where they are.
        </p>
      </header>

      <div className="disclaimer-banner">
        ⚠️ This produces a balanced recommendation using an iterative heuristic, not a guaranteed
        optimal solve. Review before finalizing.
      </div>

      <BalanceSettingsPanel
        mapping={mapping}
        accounts={accounts}
        weights={weights}
        onWeightsChange={onWeightsChange}
        tolerancePercent={tolerancePercent}
        onToleranceChange={onToleranceChange}
      />

      <BalanceResultsTable balance={balance} />

      <PairingSummary balance={balance} repRoles={repRoles} />

      <BalanceAssignmentsTable balance={balance} repRoles={repRoles} />

      <div className="config-actions">
        <button type="button" className="secondary-btn" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="export-btn" onClick={onContinue}>
          Continue to Review &amp; Export →
        </button>
      </div>
    </div>
  )
}
