import { useState } from 'react'
import UploadPage from './pages/UploadPage.jsx'
import MappingPage from './pages/MappingPage.jsx'
import ReportPage from './pages/ReportPage.jsx'

export default function App() {
  const [step, setStep] = useState('upload') // upload | mapping | report
  const [upload, setUpload] = useState(null) // { rows, headers, fileName }
  const [mapConfig, setMapConfig] = useState(null) // { mapping, repColumns }

  const handleUploaded = (data) => {
    setUpload(data)
    setMapConfig(null)
    setStep('mapping')
  }

  const handleMapped = (config) => {
    setMapConfig(config)
    setStep('report')
  }

  if (step === 'report' && upload && mapConfig) {
    return (
      <ReportPage
        rows={upload.rows}
        mapping={mapConfig.mapping}
        repColumns={mapConfig.repColumns}
        fileName={upload.fileName}
        onBack={() => setStep('mapping')}
      />
    )
  }

  if (step === 'mapping' && upload) {
    return (
      <MappingPage
        headers={upload.headers}
        rowCount={upload.rows.length}
        fileName={upload.fileName}
        onBack={() => setStep('upload')}
        onMapped={handleMapped}
      />
    )
  }

  return <UploadPage onUploaded={handleUploaded} />
}
