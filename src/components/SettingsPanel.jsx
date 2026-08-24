import { useState } from 'react'

export default function SettingsPanel({ settings, onChange, hasRenewalDate, hasRecentlyMoved }) {
  const [open, setOpen] = useState(false)

  const setField = (key, value) => {
    const n = Math.max(0, Number(value) || 0)
    onChange({ ...settings, [key]: n })
  }

  return (
    <div className="report-section">
      <div className="settings-toggle" onClick={() => setOpen((o) => !o)}>
        <h3 style={{ margin: 0 }}>Locking window settings</h3>
        <span className="link-btn">{open ? 'Hide ▲' : 'Adjust ▼'}</span>
      </div>
      {!open && (
        <p className="config-hint" style={{ margin: '6px 0 0' }}>
          Renewal window: {settings.renewalWindowDays} days · Recently-moved window:{' '}
          {settings.recentlyMovedWindowDays} days
        </p>
      )}
      {open && (
        <div className="settings-grid">
          <div className="settings-field">
            <label htmlFor="renewalWindow">
              Renewal window (days)
              <br />
              <span className="hint">
                {hasRenewalDate
                  ? 'Locks accounts whose renewal date falls within this many days of today.'
                  : 'No renewal date column mapped — this setting has no effect.'}
              </span>
            </label>
            <div className="settings-field-input">
              <input
                id="renewalWindow"
                type="number"
                min="0"
                value={settings.renewalWindowDays}
                onChange={(e) => setField('renewalWindowDays', e.target.value)}
              />
              <span className="hint">days</span>
            </div>
          </div>
          <div className="settings-field">
            <label htmlFor="movedWindow">
              Recently-moved window (days)
              <br />
              <span className="hint">
                {hasRecentlyMoved
                  ? 'Locks accounts that changed owners within this many days ago.'
                  : 'No recently-moved date column mapped — this setting has no effect.'}
              </span>
            </label>
            <div className="settings-field-input">
              <input
                id="movedWindow"
                type="number"
                min="0"
                value={settings.recentlyMovedWindowDays}
                onChange={(e) => setField('recentlyMovedWindowDays', e.target.value)}
              />
              <span className="hint">days</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
