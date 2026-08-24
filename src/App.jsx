import { useMemo, useState } from 'react'
import UploadPage from './pages/UploadPage.jsx'
import MappingPage from './pages/MappingPage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import BalancePage from './pages/BalancePage.jsx'
import { normalizeAccounts } from './lib/normalize.js'
import { buildReport } from './lib/consolidation.js'
import { DEFAULT_SETTINGS } from './lib/locking.js'

export default function App() {
  const [step, setStep] = useState('upload') // upload | mapping | report | balance
  const [upload, setUpload] = useState(null) // { rows, headers, fileName }
  const [mapConfig, setMapConfig] = useState(null) // { mapping, repColumns }
  const [lockSettings, setLockSettings] = useState(DEFAULT_SETTINGS)

  const handleUploaded = (data) => {
    setUpload(data)
    setMapConfig(null)
    setStep('mapping')
  }

  const handleMapped = (config) => {
    setMapConfig(config)
    setLockSettings(DEFAULT_SETTINGS)
    setStep('report')
  }

  const accounts = useMemo(() => {
    if (!upload || !mapConfig) return []
    return normalizeAccounts(upload.rows, mapConfig.mapping, mapConfig.repColumns)
  }, [upload, mapConfig])

  // Recomputed here (not inside ReportPage) so Pass 2's balancing step sees
  // exactly the same locked/unlocked determination the user reviewed.
  const report = useMemo(() => {
    if (accounts.length === 0) return null
    return buildReport(accounts, lockSettings)
  }, [accounts, lockSettings])

  if (step === 'balance' && upload && mapConfig && report) {
    return (
      <BalancePage
        report={report}
        accounts={accounts}
        mapping={mapConfig.mapping}
        repColumns={mapConfig.repColumns}
        fileName={upload.fileName}
        onBack={() => setStep('report')}
      />
    )
  }

  if (step === 'report' && upload && mapConfig && report) {
    return (
      <ReportPage
        report={report}
        mapping={mapConfig.mapping}
        fileName={upload.fileName}
        rowCount={upload.rows.length}
        settings={lockSettings}
        onSettingsChange={setLockSettings}
        onBack={() => setStep('mapping')}
        onContinue={() => setStep('balance')}
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
