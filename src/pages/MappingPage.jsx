import { useState } from 'react'
import StepIndicator from '../components/StepIndicator.jsx'
import RepColumnsMapper from '../components/RepColumnsMapper.jsx'
import { OPTIONAL_ROLES, REQUIRED_ROLES, REP_ROLE } from '../lib/mapping.js'

const EMPTY_MAPPING = {
  accountName: '',
  arr: '',
  segment: '',
  parentId: '',
  renewalDate: '',
  activeRenewalDiscussion: '',
  activeUpsellPipeline: '',
  recentlyMoved: '',
  manualOverride: '',
  healthScore: ''
}

function guessColumn(headers, candidates) {
  const lower = headers.map((h) => ({ h, norm: h.toLowerCase().replace(/[^a-z0-9]/g, '') }))
  for (const candidate of candidates) {
    const match = lower.find((l) => l.norm === candidate)
    if (match) return match.h
  }
  for (const candidate of candidates) {
    const match = lower.find((l) => l.norm.includes(candidate))
    if (match) return match.h
  }
  return ''
}

function buildInitialMapping(headers) {
  return {
    accountName: guessColumn(headers, ['accountname', 'account', 'customername', 'name']),
    arr: guessColumn(headers, ['arr', 'annualrecurringrevenue', 'revenue']),
    segment: guessColumn(headers, ['segment', 'tier']),
    parentId: guessColumn(headers, ['ultimateparent', 'parentaccount', 'parentid', 'parent']),
    renewalDate: guessColumn(headers, ['renewaldate', 'nextrenewal', 'renewal']),
    activeRenewalDiscussion: guessColumn(headers, ['activerenewaldiscussion', 'renewaldiscussion', 'renewalconversation']),
    activeUpsellPipeline: guessColumn(headers, ['activeupsellpipeline', 'upsellpipeline', 'upsellopportunity', 'upsell']),
    recentlyMoved: guessColumn(headers, ['recentlymoveddate', 'movedate', 'transferdate', 'bookmovedate']),
    manualOverride: guessColumn(headers, ['manualoverride', 'override', 'donotmove']),
    healthScore: guessColumn(headers, ['healthscore', 'health', 'customerhealth'])
  }
}

function buildInitialRepColumns(headers) {
  const amCol = guessColumn(headers, ['am', 'accountmanager', 'owner', 'rep'])
  if (amCol) return [{ id: 'rep-0', label: 'Owner', column: amCol }]
  return [{ id: 'rep-0', label: 'Owner', column: '' }]
}

export default function MappingPage({ headers, rowCount, fileName, onBack, onMapped }) {
  const [mapping, setMapping] = useState(() => buildInitialMapping(headers))
  const [repColumns, setRepColumns] = useState(() => buildInitialRepColumns(headers))
  const [error, setError] = useState('')

  const updateMapping = (key, value) => setMapping((m) => ({ ...m, [key]: value }))

  const validate = () => {
    const missing = REQUIRED_ROLES.find((r) => !mapping[r.key])
    if (missing) return `Map a column for "${missing.label}" before continuing.`
    const validReps = repColumns.filter((rc) => rc.column)
    if (validReps.length === 0) return 'Map at least one owner/rep column.'
    const unlabeled = validReps.find((rc) => !rc.label.trim())
    if (unlabeled) return `Give the rep column mapped to "${unlabeled.column}" a role label (e.g. "AM").`
    return ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = validate()
    setError(err)
    if (err) return
    onMapped({ mapping, repColumns: repColumns.filter((rc) => rc.column) })
  }

  const optionalMissingCount = OPTIONAL_ROLES.filter((r) => !mapping[r.key]).length

  return (
    <div className="app">
      <StepIndicator current={2} />

      <button type="button" className="back-link" onClick={onBack}>
        ← Back to upload
      </button>

      <header className="app-header">
        <h1>Map your columns</h1>
        <p className="subtitle">
          Using <strong>{fileName}</strong> — {rowCount.toLocaleString()} rows. Tell us which
          column in your file holds each piece of information.
        </p>
      </header>

      <form className="upload-section" onSubmit={handleSubmit}>
        <div className="config-section">
          <h3>Required fields</h3>
          <p className="config-hint">These four roles must be mapped before we can build a report.</p>
          <div className="mapping-grid">
            {REQUIRED_ROLES.map((role) => (
              <label key={role.key} className="mapping-field">
                <span>{role.label}</span>
                <select value={mapping[role.key]} onChange={(e) => updateMapping(role.key, e.target.value)}>
                  <option value="">— select column —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="mapping-hint-line">{REP_ROLE.label} — {REP_ROLE.description}</div>
          <div style={{ marginTop: 10 }}>
            <RepColumnsMapper repColumns={repColumns} headers={headers} onChange={setRepColumns} />
          </div>
        </div>

        <div className="config-section">
          <h3>Optional fields</h3>
          <p className="config-hint">
            Map what you have — leave the rest blank. {optionalMissingCount} of {OPTIONAL_ROLES.length}{' '}
            currently unmapped.
          </p>
          <div className="mapping-grid">
            {OPTIONAL_ROLES.map((role) => (
              <label key={role.key} className="mapping-field">
                <span>{role.label}</span>
                <select value={mapping[role.key]} onChange={(e) => updateMapping(role.key, e.target.value)}>
                  <option value="">— not in file —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className="mapping-field-optional-note">
                  {mapping[role.key] ? `Enables: ${role.enables}` : role.missing}
                </span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="file-error">{error}</p>}

        <div className="config-actions">
          <button type="button" className="secondary-btn" onClick={onBack}>
            ← Back
          </button>
          <button type="submit" className="export-btn">
            Build Locking Report →
          </button>
        </div>
      </form>
    </div>
  )
}
