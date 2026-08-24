function formatCurrency(n) {
  return (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function BalanceAssignmentsTable({ balance, repRoles }) {
  const rows = balance.assignmentLog

  return (
    <div className="report-section">
      <h3 style={{ marginTop: 0 }}>Assignment detail</h3>
      <p className="config-hint">
        Every unlocked account/group processed by the heuristic, in the order it was assigned
        (largest ARR first within each segment), and which rep(s) it landed on. Locked
        accounts/groups aren't listed here — they didn't move.
      </p>
      <div className="table-wrap">
        <table className="lock-table">
          <thead>
            <tr>
              <th>Account / Group</th>
              <th>Segment</th>
              <th className="num">ARR</th>
              {repRoles.map((role) => (
                <th key={role}>{role}</th>
              ))}
              <th>Pairing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.groupId}>
                <td className="account-name-main">{row.groupName}</td>
                <td>{row.segment}</td>
                <td className="num">{formatCurrency(row.arr)}</td>
                {repRoles.map((role) => (
                  <td key={role}>{row.roleMap[role] || <span className="no-reasons">—</span>}</td>
                ))}
                <td>
                  {Object.keys(row.roleMap).length >= 2 ? (
                    row.reusedPairing ? (
                      <span className="badge badge-green">Reused</span>
                    ) : (
                      <span className="reason-badge">New pairing</span>
                    )
                  ) : (
                    <span className="no-reasons">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
