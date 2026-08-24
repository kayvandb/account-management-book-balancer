import { METRICS } from '../lib/metrics.js'
import { DEFAULT_TOLERANCE_PERCENT } from '../lib/balancing.js'

export default function BalanceSettingsPanel({ mapping, accounts, weights, onWeightsChange, tolerancePercent, onToleranceChange }) {
  const setWeight = (key, value) => {
    const n = Math.max(0, Math.min(100, Number(value) || 0))
    onWeightsChange({ ...weights, [key]: n })
  }

  return (
    <div className="report-section">
      <h3 style={{ marginTop: 0 }}>Balancing weights</h3>
      <p className="config-hint">
        Set how much each metric should matter when deciding who's furthest below their fair
        share. Weights are relative to each other and don't need to add up to anything in
        particular. A metric with no source column mapped is excluded from the calculation
        entirely, not treated as zero.
      </p>

      <div className="weights-list">
        {METRICS.map((metric) => {
          const available = metric.isAvailable(mapping, accounts)
          return (
            <div className={`weight-row${available ? '' : ' weight-row-disabled'}`} key={metric.key}>
              <div className="weight-row-label">
                <span>{metric.label}</span>
                {!available && <span className="weight-row-note">No source column mapped — excluded</span>}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weights[metric.key]}
                disabled={!available}
                onChange={(e) => setWeight(metric.key, e.target.value)}
              />
              <input
                type="number"
                min="0"
                max="100"
                className="weight-number"
                value={weights[metric.key]}
                disabled={!available}
                onChange={(e) => setWeight(metric.key, e.target.value)}
              />
            </div>
          )
        })}
      </div>

      <div className="config-section">
        <h3>Multi-IC pairing reuse tolerance</h3>
        <p className="config-hint">
          When an account needs more than one rep role, the engine prefers reusing a rep
          combination that already appears together elsewhere over inventing a new pairing — as
          long as doing so lands within this many percentage points of the best purely-balanced
          option (measured in weighted fair-share deficit).
        </p>
        <div className="settings-field-input">
          <input
            type="number"
            min="0"
            max="50"
            value={tolerancePercent}
            onChange={(e) => onToleranceChange(Math.max(0, Math.min(50, Number(e.target.value) || 0)))}
          />
          <span className="hint">
            % (default {DEFAULT_TOLERANCE_PERCENT}%)
          </span>
        </div>
      </div>
    </div>
  )
}
