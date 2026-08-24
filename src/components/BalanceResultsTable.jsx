import { Fragment } from 'react'
import { formatMetricValue } from '../lib/metrics.js'

export default function BalanceResultsTable({ balance }) {
  const { metrics, byRole } = balance
  const roles = Object.keys(byRole)

  return (
    <div className="report-section">
      <h3 style={{ marginTop: 0 }}>Rep load: before vs. after</h3>
      <p className="config-hint">
        Every rep's book across each weighted metric, before this rebalance and after applying the
        recommendation. "Fair-share target" is that segment pool's total for the metric — locked
        accounts included — divided evenly across the reps who already work that segment in this
        role. Changed cells are highlighted.
      </p>

      {roles.map((role) => (
        <div key={role} className="balance-role-block">
          <h4 className="balance-role-heading">{role}</h4>
          {Object.entries(byRole[role]).map(([segment, data]) => (
            <div key={segment} className="balance-segment-block">
              <div className="balance-segment-label">
                {segment} <span className="balance-segment-repcount">· {data.reps.length} rep{data.reps.length === 1 ? '' : 's'}</span>
              </div>
              {data.reps.length === 0 ? (
                <p className="no-reasons">No reps currently hold this role in this segment.</p>
              ) : (
                <div className="table-wrap">
                  <table className="lock-table balance-table">
                    <thead>
                      <tr>
                        <th rowSpan={2}>Rep</th>
                        {metrics.map((m) => (
                          <th key={m.key} colSpan={2} className="balance-metric-header">
                            {m.shortLabel}
                          </th>
                        ))}
                      </tr>
                      <tr>
                        {metrics.map((m) => (
                          <Fragment key={m.key}>
                            <th className="num sub-col metric-start">Before</th>
                            <th className="num sub-col">After</th>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="target-row">
                        <td>
                          <em>Fair-share target</em>
                        </td>
                        {metrics.map((m) => (
                          <td className="num metric-start" colSpan={2} key={m.key}>
                            {formatMetricValue(m, data.targets[m.key])}
                          </td>
                        ))}
                      </tr>
                      {data.reps.map((rep) => {
                        const before = data.beforeLoad.get(rep)
                        const after = data.afterLoad.get(rep)
                        return (
                          <tr key={rep}>
                            <td className="account-name-main">{rep}</td>
                            {metrics.map((m) => {
                              const changed = Math.round(before[m.key]) !== Math.round(after[m.key])
                              return (
                                <Fragment key={m.key}>
                                  <td className="num metric-start">{formatMetricValue(m, before[m.key])}</td>
                                  <td className={`num${changed ? ' balance-changed' : ''}`}>
                                    {formatMetricValue(m, after[m.key])}
                                  </td>
                                </Fragment>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
