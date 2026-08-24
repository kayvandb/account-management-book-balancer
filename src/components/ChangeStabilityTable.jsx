function formatCurrency(n) {
  return (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtCount(n) {
  return Math.round(n * 10) / 10
}

function fmtPct(p) {
  return p == null ? '—' : `${Math.round(p)}%`
}

function Cell({ value, pct, isCurrency }) {
  return (
    <td className="num metric-start">
      {isCurrency ? formatCurrency(value) : fmtCount(value)}
      <span className="stability-pct"> ({fmtPct(pct)})</span>
    </td>
  )
}

export default function ChangeStabilityTable({ changeStats, repRoles }) {
  return (
    <div className="report-section">
      <h3 style={{ marginTop: 0 }}>Change / stability report by rep</h3>
      <p className="config-hint">
        How much each rep's book moved. Percentages are relative to that rep's book <em>before</em>{' '}
        this rebalance (unchanged + lost) — so "Gained" can read over 100% for a rep who started
        with very little and picked up a lot. Reflects any manual overrides applied above.
      </p>

      {repRoles.map((role) => {
        const rows = changeStats[role] || []
        return (
          <div key={role} className="balance-role-block">
            <h4 className="balance-role-heading">{role}</h4>
            <div className="table-wrap">
              <table className="lock-table balance-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Rep</th>
                    <th rowSpan={2} className="num">
                      Pre-book
                    </th>
                    <th colSpan={3} className="balance-metric-header">
                      Book count
                    </th>
                    <th colSpan={3} className="balance-metric-header">
                      ARR
                    </th>
                  </tr>
                  <tr>
                    <th className="num sub-col metric-start">Unchanged</th>
                    <th className="num sub-col">Lost</th>
                    <th className="num sub-col">Gained</th>
                    <th className="num sub-col metric-start">Unchanged</th>
                    <th className="num sub-col">Lost</th>
                    <th className="num sub-col">Gained</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.rep}>
                      <td className="account-name-main">{r.rep}</td>
                      <td className="num">
                        {fmtCount(r.preBookCount)} logos / {formatCurrency(r.preBookARR)}
                      </td>
                      <Cell value={r.unchangedCount} pct={r.unchangedPctCount} />
                      <td className="num">
                        {fmtCount(r.lostCount)}
                        <span className="stability-pct"> ({fmtPct(r.lostPctCount)})</span>
                      </td>
                      <td className="num">
                        {fmtCount(r.gainedCount)}
                        <span className="stability-pct"> ({fmtPct(r.gainedPctCount)})</span>
                      </td>
                      <Cell value={r.unchangedARR} pct={r.unchangedPctArr} isCurrency />
                      <td className="num">
                        {formatCurrency(r.lostARR)}
                        <span className="stability-pct"> ({fmtPct(r.lostPctArr)})</span>
                      </td>
                      <td className="num">
                        {formatCurrency(r.gainedARR)}
                        <span className="stability-pct"> ({fmtPct(r.gainedPctArr)})</span>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="no-reasons">
                        No reps hold this role.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
