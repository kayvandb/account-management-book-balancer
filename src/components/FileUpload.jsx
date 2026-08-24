import { useRef, useState } from 'react'

export default function FileUpload({ onFile, disabled, hint = '.xlsx, .xls, or .csv — one row per account' }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = (files) => {
    if (files && files.length > 0) {
      onFile(files[0])
    }
  }

  return (
    <div
      className={`dropzone${dragOver ? ' dropzone-active' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        hidden
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="dropzone-icon">📄</div>
      <div className="dropzone-text">
        <strong>Click to upload</strong> or drag and drop
        <div className="dropzone-hint">{hint}</div>
      </div>
    </div>
  )
}
