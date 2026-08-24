import { OPTIONAL_ROLES, REQUIRED_ROLES, REP_ROLE } from '../lib/mapping.js'

export default function FileRequirementsPanel() {
  return (
    <div className="requirements-panel">
      <h2>What your file needs</h2>
      <p className="config-hint">
        One row per account. You'll map your actual column headers to these roles on the next
        screen — they don't need to match these names.
      </p>

      <div className="req-group-label">Required</div>
      <div className="req-list">
        {REQUIRED_ROLES.map((role) => (
          <div className="req-item" key={role.key}>
            <span className="req-badge req-badge-required">Required</span>
            <span>
              <strong>{role.label}</strong> — {role.description}
            </span>
          </div>
        ))}
        <div className="req-item">
          <span className="req-badge req-badge-required">Required</span>
          <span>
            <strong>{REP_ROLE.label}</strong> — {REP_ROLE.description}
          </span>
        </div>
      </div>

      <div className="req-group-label">Optional, but recommended</div>
      <div className="req-list">
        {OPTIONAL_ROLES.map((role) => (
          <div className="req-item" key={role.key}>
            <span className="req-badge req-badge-optional">Optional</span>
            <span>
              <strong>{role.label}</strong>
              <span className="req-item-detail">
                Enables: {role.enables}
                <br />
                <span className="req-fallback">If missing: {role.missing}</span>
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
