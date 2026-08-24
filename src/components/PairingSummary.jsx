export default function PairingSummary({ balance, repRoles }) {
  if (repRoles.length < 2) {
    return (
      <div className="report-section">
        <h3 style={{ marginTop: 0 }}>Multi-IC pairing</h3>
        <p className="config-hint" style={{ margin: 0 }}>
          Only one rep role is mapped, so there's nothing to pair — this section applies once an
          account needs two or more reps (e.g. an AM and a Renewal Manager) at the same time.
        </p>
      </div>
    )
  }

  const { before, after } = balance.pairing
  const multiRoleMoves = balance.assignmentLog.filter((a) => Object.keys(a.roleMap).length >= 2)
  const reusedCount = multiRoleMoves.filter((a) => a.reusedPairing).length
  const newPairCount = multiRoleMoves.length - reusedCount
  const delta = after.distinctCount - before.distinctCount

  return (
    <div className="report-section">
      <h3 style={{ marginTop: 0 }}>Multi-IC pairing</h3>
      <p className="config-hint">
        A "pairing" is the specific combination of reps (one per role) sharing an account or
        group. Fewer distinct pairings means less coordination overhead across the book.
      </p>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-value">{before.distinctCount}</div>
          <div className="stat-card-label">Distinct pairings before</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{after.distinctCount}</div>
          <div className="stat-card-label">Distinct pairings after</div>
        </div>
        <div className="stat-card">
          <div className={`stat-card-value${delta < 0 ? ' unlocked' : delta > 0 ? ' locked' : ''}`}>
            {delta > 0 ? `+${delta}` : delta}
          </div>
          <div className="stat-card-label">Change</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{reusedCount}</div>
          <div className="stat-card-label">Reassignments reusing a pairing</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{newPairCount}</div>
          <div className="stat-card-label">Reassignments creating a new pairing</div>
        </div>
      </div>
    </div>
  )
}
