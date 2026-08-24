export default function RepColumnsMapper({ repColumns, headers, onChange }) {
  const update = (id, patch) => {
    onChange(repColumns.map((rc) => (rc.id === id ? { ...rc, ...patch } : rc)))
  }

  const remove = (id) => {
    onChange(repColumns.filter((rc) => rc.id !== id))
  }

  const add = () => {
    onChange([...repColumns, { id: `rep-${Date.now()}`, label: '', column: '' }])
  }

  return (
    <div className="rep-columns-list">
      {repColumns.map((rc) => (
        <div className="rep-column-row" key={rc.id}>
          <input
            type="text"
            placeholder="Role label (e.g. AM)"
            value={rc.label}
            onChange={(e) => update(rc.id, { label: e.target.value })}
          />
          <select value={rc.column} onChange={(e) => update(rc.id, { column: e.target.value })}>
            <option value="">— select column —</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="icon-btn"
            onClick={() => remove(rc.id)}
            disabled={repColumns.length <= 1}
            title="Remove this rep column"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="add-rep-btn" onClick={add}>
        + Add another rep column
      </button>
    </div>
  )
}
