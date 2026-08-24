import { REASON_LABELS } from '../lib/locking.js'

export default function SummaryStats({ stats }) {
  return (
    <div className="report-section">
      <h3 style={{ marginTop: 0 }}>Summary</h3>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-value">{stats.totalGroups}</div>
          <div className="stat-card-label">Accounts / groups in report</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value locked">{stats.lockedCount}</div>
          <div className="stat-card-label">Locked</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value unlocked">{stats.unlockedCount}</div>
          <div className="stat-card-label">Unlocked</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.consolidatedGroupCount}</div>
          <div className="stat-card-label">Consolidated parent groups</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.accountsFolded}</div>
          <div className="stat-card-label">Accounts folded into groups</div>
        </div>
      </div>

      <div className="config-hint" style={{ marginBottom: 8 }}>
        Locked accounts by reason (an account can count toward more than one):
      </div>
      <div className="reason-breakdown">
        {Object.entries(REASON_LABELS).map(([type, label]) => (
          <span className="reason-count-chip" key={type}>
            {label}: <strong>{stats.reasonCounts[type] || 0}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}
