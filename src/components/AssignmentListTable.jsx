import { Fragment, useMemo, useState } from 'react'

function formatCurrency(n) {
  return (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function OverrideRow({ row, repRoles, allRepsByRole, overrides, onSetOverride, onResetOverride, onClose }) {
  const current = overrides[row.groupId] || {}
  return (
    <tr className="override-row">
      <td colSpan={4 + repRoles.length}>
        <div className="override-panel">
          <span className="override-panel-label">Manually reassign:</span>
          {repRoles.map((role) => (
            <label key={role} className="override-field">
              <span>{role}</span>
              <select
                value={current[role] || ''}
                onChange={(e) => onSetOverride(row.groupId, role, e.target.value)}
              >
                <option value="">— use recommendation —</option>
                {(allRepsByRole[role] || []).map((rep) => (
                  <option key={rep} value={rep}>
                    {rep}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {row.isOverridden && (
            <button type="button" className="link-btn" onClick={() => onResetOverride(row.groupId)}>
              Reset to recommendation
            </button>
          )}
          <button type="button" className="secondary-btn override-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function AssignmentListTable({ rows, repRoles, allRepsByRole, overrides, onSetOverride, onResetOverride, onExportCsv }) {
  const [search, setSearch] = useState('')
  const [changedOnly, setChangedOnly] = useState(false)
  const [segmentFilter, setSegmentFilter] = useState('')
  const [sortKey, setSortKey] = useState('arr')
  const [sortDir, setSortDir] = useState('desc')
  const [editingId, setEditingId] = useState(null)

  const segments = useMemo(() => Array.from(new Set(rows.map((r) => r.segment))).sort(), [rows])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (changedOnly && !r.changed) return false
      if (segmentFilter && r.segment !== segmentFilter) return false
      if (term && !r.displayName.toLowerCase().includes(term)) return false
      return true
    })
  }, [rows, search, changedOnly, segmentFilter])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    const copy = [...filtered]
    copy.sort((a, b) => {
      if (sortKey === 'name') return a.displayName.localeCompare(b.displayName) * dir
      if (sortKey === 'segment') return a.segment.localeCompare(b.segment) * dir
      if (sortKey === 'arr') return (a.arr - b.arr) * dir
      if (sortKey === 'status') return (Number(a.changed) - Number(b.changed)) * dir
      return 0
    })
    return copy
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'segment' ? 'asc' : 'desc')
    }
  }

  const sortIndicator = (key) => (sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '')

  return (
    <div className="report-section">
      <div className="results-toolbar">
        <div>
          <h3 style={{ margin: 0 }}>Final assignment list</h3>
          <p className="config-hint" style={{ margin: '4px 0 0' }}>
            Every account/group and where it lands going forward. Click a row's "Override" button
            to manually reassign an unlocked account.
          </p>
        </div>
        <button type="button" className="export-btn" onClick={onExportCsv}>
          Export CSV
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="filter-search"
          placeholder="Search account/group name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)}>
          <option value="">All segments</option>
          {segments.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="window-option">
          <input type="checkbox" checked={changedOnly} onChange={(e) => setChangedOnly(e.target.checked)} />
          Changed only
        </label>
        <span className="filter-count">
          {sorted.length} of {rows.length}
        </span>
      </div>

      <div className="table-wrap">
        <table className="lock-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('name')}>
                Account / Group{sortIndicator('name')}
              </th>
              <th className="sortable" onClick={() => toggleSort('segment')}>
                Segment{sortIndicator('segment')}
              </th>
              <th className="num sortable" onClick={() => toggleSort('arr')}>
                ARR{sortIndicator('arr')}
              </th>
              <th className="sortable" onClick={() => toggleSort('status')}>
                Status{sortIndicator('status')}
              </th>
              {repRoles.map((role) => (
                <th key={role}>{role}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <Fragment key={row.groupId}>
                <tr className="group-row">
                  <td>
                    <div className="account-name-main">{row.displayName}</div>
                    {row.isConsolidated && (
                      <span className="consolidated-tag">Consolidated · {row.memberCount} accounts</span>
                    )}
                  </td>
                  <td>{row.segment}</td>
                  <td className="num">{formatCurrency(row.arr)}</td>
                  <td>
                    {row.locked ? (
                      <span className="badge badge-red">Locked</span>
                    ) : row.changed ? (
                      <span className="badge badge-changed">Reassigned</span>
                    ) : (
                      <span className="badge badge-green">Unchanged</span>
                    )}
                    {row.isOverridden && <span className="override-tag">Overridden</span>}
                  </td>
                  {row.perRole.map((r) => (
                    <td key={r.role}>
                      {r.changed ? (
                        <span className="from-to">
                          <span className="from-value">{r.from || '—'}</span>
                          <span className="arrow">→</span>
                          <span className="to-value">{r.to || '—'}</span>
                        </span>
                      ) : (
                        <span>{r.to || '—'}</span>
                      )}
                    </td>
                  ))}
                  <td>
                    {row.eligibleForOverride && (
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => setEditingId(editingId === row.groupId ? null : row.groupId)}
                      >
                        {editingId === row.groupId ? 'Cancel' : 'Override'}
                      </button>
                    )}
                  </td>
                </tr>
                {editingId === row.groupId && (
                  <OverrideRow
                    row={row}
                    repRoles={repRoles}
                    allRepsByRole={allRepsByRole}
                    overrides={overrides}
                    onSetOverride={onSetOverride}
                    onResetOverride={onResetOverride}
                    onClose={() => setEditingId(null)}
                  />
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
