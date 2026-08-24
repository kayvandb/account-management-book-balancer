import { Fragment, useState } from 'react'

function formatCurrency(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function RepList({ reps }) {
  if (reps.length === 0) return <span className="no-reasons">—</span>
  return reps.map((r) => (
    <span className="rep-line" key={r.role}>
      <strong>{r.role}:</strong> {r.name || '—'}
    </span>
  ))
}

function ReasonBadges({ reasons }) {
  if (reasons.length === 0) return <span className="no-reasons">—</span>
  return reasons.map((r) => {
    const title = r.accounts ? r.accounts.map((a) => `${a.name}: ${a.detail}`).join('\n') : r.detail
    return (
      <span className="reason-badge" key={r.type} title={title}>
        {r.label}
        {r.accounts && r.accounts.length > 1 ? ` (${r.accounts.length})` : ''}
      </span>
    )
  })
}

export default function LockReportTable({ groups }) {
  const [expanded, setExpanded] = useState(() => new Set())

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="report-section">
      <h3 style={{ marginTop: 0 }}>Locking report</h3>
      <p className="config-hint">
        Every account or consolidated group, its current owner(s), and whether it's locked from
        rebalancing — with every reason that applies. Click a consolidated group to see its member
        accounts.
      </p>
      <div className="table-wrap">
        <table className="lock-table">
          <thead>
            <tr>
              <th>Account / Group</th>
              <th>Owner(s)</th>
              <th className="num">ARR</th>
              <th>Segment</th>
              <th>Status</th>
              <th>Reasons</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const isOpen = expanded.has(group.id)
              return (
                <Fragment key={group.id}>
                  <tr className="group-row">
                    <td>
                      <div className="account-name-cell">
                        {group.isConsolidated ? (
                          <button
                            type="button"
                            className={`expand-btn${isOpen ? ' expanded' : ''}`}
                            onClick={() => toggle(group.id)}
                            aria-label="Toggle member accounts"
                          >
                            ▶
                          </button>
                        ) : (
                          <span className="expand-spacer" />
                        )}
                        <div>
                          <div className="account-name-main">{group.displayName}</div>
                          {group.isConsolidated && (
                            <span className="consolidated-tag">
                              Consolidated · {group.members.length} accounts
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <RepList reps={group.reps} />
                    </td>
                    <td className="num">{formatCurrency(group.arr)}</td>
                    <td>
                      {group.segments.map((s) => (
                        <span className="segment-chip" key={s}>
                          {s}
                        </span>
                      ))}
                    </td>
                    <td>
                      {group.locked ? (
                        <span className="badge badge-red">Locked</span>
                      ) : (
                        <span className="badge badge-green">Unlocked</span>
                      )}
                    </td>
                    <td>
                      <ReasonBadges reasons={group.reasons} />
                    </td>
                  </tr>
                  {group.isConsolidated &&
                    isOpen &&
                    group.memberLocks.map(({ account, lock }) => (
                      <tr className="member-row" key={`${group.id}-${account.id}`}>
                        <td>
                          <div className="member-indent">{account.accountName}</div>
                        </td>
                        <td>
                          <RepList reps={account.reps} />
                        </td>
                        <td className="num">{formatCurrency(account.arr)}</td>
                        <td>
                          <span className="segment-chip">{account.segment}</span>
                        </td>
                        <td>
                          {lock.locked ? (
                            <span className="badge badge-red">Locked</span>
                          ) : (
                            <span className="badge badge-green">Unlocked</span>
                          )}
                        </td>
                        <td>
                          {lock.reasons.length === 0 ? (
                            <span className="no-reasons">—</span>
                          ) : (
                            lock.reasons.map((r) => (
                              <span className="reason-badge" key={r.type} title={r.detail}>
                                {r.label}
                              </span>
                            ))
                          )}
                        </td>
                      </tr>
                    ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
