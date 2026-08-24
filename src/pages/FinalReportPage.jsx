import { useMemo } from 'react'
import StepIndicator from '../components/StepIndicator.jsx'
import AssignmentListTable from '../components/AssignmentListTable.jsx'
import DistributionSummaryTable from '../components/DistributionSummaryTable.jsx'
import ChangeStabilityTable from '../components/ChangeStabilityTable.jsx'
import { buildAssignmentList, buildChangeStats, summarizeChangeStats, buildDistributionSummary } from '../lib/finalState.js'
import { toCsv, downloadCsv, downloadWorkbook } from '../lib/fileParser.js'

function round1(n) {
  return Math.round((n || 0) * 10) / 10
}

function roundPct(p) {
  return p == null ? '' : Math.round(p * 10) / 10
}

export default function FinalReportPage({ report, accounts, mapping, repColumns, balance, overrides, setOverrides, fileName, onBack }) {
  const repRoles = useMemo(
    () => Array.from(new Set(repColumns.map((rc) => rc.label || rc.column))),
    [repColumns]
  )

  const allRepsByRole = useMemo(() => {
    const byRole = {}
    for (const role of repRoles) {
      const set = new Set()
      for (const account of accounts) {
        for (const rep of account.reps) {
          if (rep.role === role && rep.name) set.add(rep.name)
        }
      }
      byRole[role] = Array.from(set).sort()
    }
    return byRole
  }, [accounts, repRoles])

  const assignmentList = useMemo(
    () => buildAssignmentList(report.groups, repRoles, balance.assignments, overrides),
    [report, repRoles, balance, overrides]
  )

  const changeStats = useMemo(
    () => summarizeChangeStats(buildChangeStats(report.groups, repRoles, balance.assignments, overrides)),
    [report, repRoles, balance, overrides]
  )

  const distribution = useMemo(
    () => buildDistributionSummary(report.groups, repRoles, balance.assignments, overrides),
    [report, repRoles, balance, overrides]
  )

  const onSetOverride = (groupId, role, repName) => {
    setOverrides((prev) => {
      const next = { ...prev }
      const groupOverrides = { ...(next[groupId] || {}) }
      if (repName) {
        groupOverrides[role] = repName
      } else {
        delete groupOverrides[role]
      }
      if (Object.keys(groupOverrides).length === 0) {
        delete next[groupId]
      } else {
        next[groupId] = groupOverrides
      }
      return next
    })
  }

  const onResetOverride = (groupId) => {
    setOverrides((prev) => {
      const next = { ...prev }
      delete next[groupId]
      return next
    })
  }

  const exportAssignmentCsv = () => {
    const columns = [
      { label: 'Account / Group', value: (r) => r.displayName },
      { label: 'Type', value: (r) => (r.isConsolidated ? `Consolidated (${r.memberCount} accounts)` : 'Single account') },
      { label: 'Segment', value: (r) => r.segment },
      { label: 'ARR', value: (r) => r.arr },
      { label: 'Locked', value: (r) => (r.locked ? 'Yes' : 'No') },
      { label: 'Changed', value: (r) => (r.changed ? 'Yes' : 'No') },
      { label: 'Manually Overridden', value: (r) => (r.isOverridden ? 'Yes' : 'No') },
      ...repRoles.flatMap((role) => [
        { label: `${role} - From`, value: (r) => r.perRole.find((x) => x.role === role)?.from || '' },
        { label: `${role} - To`, value: (r) => r.perRole.find((x) => x.role === role)?.to || '' }
      ])
    ]
    downloadCsv(toCsv(assignmentList, columns), `final-assignment-list-${fileName.replace(/\.[^.]+$/, '')}.csv`)
  }

  const exportSummaryWorkbook = () => {
    const monthLabels = distribution[repRoles[0]]?.months.map((b) => b.label) || []
    const quarterLabels = distribution[repRoles[0]]?.quarters.map((b) => b.label) || []

    const monthlyRows = []
    const quarterlyRows = []
    for (const role of repRoles) {
      for (const repRow of distribution[role].reps) {
        const monthly = { Role: role, Rep: repRow.rep, Logos: round1(repRow.logos) }
        repRow.monthly.forEach((b, i) => {
          monthly[`${monthLabels[i]} Renewals`] = b.renewals
          monthly[`${monthLabels[i]} ARR Expiring`] = b.arr
        })
        monthlyRows.push(monthly)

        const quarterly = { Role: role, Rep: repRow.rep, Logos: round1(repRow.logos) }
        repRow.quarterly.forEach((b, i) => {
          quarterly[`${quarterLabels[i]} Renewals`] = b.renewals
          quarterly[`${quarterLabels[i]} ARR Expiring`] = b.arr
        })
        quarterlyRows.push(quarterly)
      }
    }

    const changeRows = []
    for (const role of repRoles) {
      for (const r of changeStats[role] || []) {
        changeRows.push({
          Role: role,
          Rep: r.rep,
          'Pre-Book Count': round1(r.preBookCount),
          'Pre-Book ARR': r.preBookARR,
          'Unchanged Count': round1(r.unchangedCount),
          'Unchanged %': roundPct(r.unchangedPctCount),
          'Lost Count': round1(r.lostCount),
          'Lost %': roundPct(r.lostPctCount),
          'Gained Count': round1(r.gainedCount),
          'Gained %': roundPct(r.gainedPctCount),
          'Unchanged ARR': r.unchangedARR,
          'Unchanged ARR %': roundPct(r.unchangedPctArr),
          'Lost ARR': r.lostARR,
          'Lost ARR %': roundPct(r.lostPctArr),
          'Gained ARR': r.gainedARR,
          'Gained ARR %': roundPct(r.gainedPctArr)
        })
      }
    }

    downloadWorkbook(
      [
        { name: 'Distribution - Monthly', rows: monthlyRows },
        { name: 'Distribution - Quarterly', rows: quarterlyRows },
        { name: 'Change & Stability', rows: changeRows }
      ],
      `final-report-summary-${fileName.replace(/\.[^.]+$/, '')}.xlsx`
    )
  }

  const changedCount = assignmentList.filter((r) => r.changed).length

  return (
    <div className="app">
      <StepIndicator current={5} />

      <button type="button" className="back-link" onClick={onBack}>
        ← Back to balance
      </button>

      <header className="app-header">
        <h1>Review &amp; export</h1>
        <p className="subtitle">
          <strong>{fileName}</strong> — {changedCount.toLocaleString()} of {assignmentList.length.toLocaleString()}{' '}
          accounts/groups are reassigned by the recommendation. Override anything below before
          exporting; every report on this page recalculates live.
        </p>
      </header>

      <AssignmentListTable
        rows={assignmentList}
        repRoles={repRoles}
        allRepsByRole={allRepsByRole}
        overrides={overrides}
        onSetOverride={onSetOverride}
        onResetOverride={onResetOverride}
        onExportCsv={exportAssignmentCsv}
      />

      <div className="results-toolbar" style={{ marginBottom: -8 }}>
        <div />
        <button type="button" className="export-btn" onClick={exportSummaryWorkbook}>
          Export summary (.xlsx)
        </button>
      </div>

      <DistributionSummaryTable distribution={distribution} repRoles={repRoles} />

      <ChangeStabilityTable changeStats={changeStats} repRoles={repRoles} />
    </div>
  )
}
