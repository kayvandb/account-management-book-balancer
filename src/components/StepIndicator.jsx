const STEPS = [
  { step: 1, label: 'Upload' },
  { step: 2, label: 'Map Columns' },
  { step: 3, label: 'Locking Report' }
]

export default function StepIndicator({ current }) {
  return (
    <div className="step-indicator">
      {STEPS.map((s, i) => (
        <div
          key={s.step}
          className={`step-item${s.step === current ? ' step-item-active' : ''}${s.step < current ? ' step-item-done' : ''}`}
        >
          <span className="step-dot">{s.step < current ? '✓' : s.step}</span>
          <span className="step-label">{s.label}</span>
          {i < STEPS.length - 1 && <span className="step-connector" />}
        </div>
      ))}
    </div>
  )
}
