import { Fragment, useState } from 'react'

function formatCurrency(n) {
  return (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function DistributionSummaryTable({ distribution, repRoles }) {
  const [view, setView] = useState('monthly') // monthly | quarterly

  return (
    <div className="report-section">
      <div className="results-toolbar">
        <div>
          <h3 style={{ margin: 0 }}>Distribution summary by rep</h3>
          <p className="config-hint" style={{ margin: '4px 0 0' }}>
            Each rep's final logo count, and their renewal workload — count and ARR expiring —
            broken out over time. Reflects any manual overrides applied above.
          </p>
        </div>
        <div className="view-toggle">
          <button
            type="button"
            className={`toggle-btn${view === 'monthly' ? ' toggle-btn-active' : ''}`}
            onClick={() => setView('monthly')}
          >
            By month
          </button>
          <button
            type="button"
            className={`toggle-btn${view === 'quarterly' ? ' toggle-btn-active' : ''}`}
            onClick={() => setView('quarterly')}
          >
            By quarter
          </button>
        </div>
      </div>

      {repRoles.map((role) => {
        const data = distribution[role]
        const buckets = view === 'monthly' ? data.months : data.quarters
        return (
          <div key={role} className="balance-role-block">
            <h4 className="balance-role-heading">{role}</h4>
            <div className="table-wrap">
              <table className="lock-table balance-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Rep</th>
                    <th rowSpan={2} className="num">
                      Logos
                    </th>
                    {buckets.map((b) => (
                      <th key={b.label} colSpan={2} className="balance-metric-header">
                        {b.label}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {buckets.map((b) => (
                      <Fragment key={b.label}>
                        <th className="num sub-col metric-start">Renewals</th>
                        <th className="num sub-col">ARR Expiring</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.reps.map((repRow) => {
                    const rowBuckets = view === 'monthly' ? repRow.monthly : repRow.quarterly
                    return (
                      <tr key={repRow.rep}>
                        <td className="account-name-main">{repRow.rep}</td>
                        <td className="num">{Math.round(repRow.logos * 10) / 10}</td>
                        {rowBuckets.map((b, i) => (
                          <Fragment key={i}>
                            <td className="num metric-start">{b.renewals}</td>
                            <td className="num">{formatCurrency(b.arr)}</td>
                          </Fragment>
                        ))}
                      </tr>
                    )
                  })}
                  {data.reps.length === 0 && (
                    <tr>
                      <td colSpan={2 + buckets.length * 2} className="no-reasons">
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
