import { useMemo, useState } from 'react'
import UploadPage from './pages/UploadPage.jsx'
import MappingPage from './pages/MappingPage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import BalancePage from './pages/BalancePage.jsx'
import FinalReportPage from './pages/FinalReportPage.jsx'
import { normalizeAccounts } from './lib/normalize.js'
import { buildReport } from './lib/consolidation.js'
import { DEFAULT_SETTINGS } from './lib/locking.js'
import { runBalance, DEFAULT_TOLERANCE_PERCENT } from './lib/balancing.js'
import { DEFAULT_WEIGHTS } from './lib/metrics.js'

export default function App() {
  const [step, setStep] = useState('upload') // upload | mapping | report | balance | finalReport
  const [upload, setUpload] = useState(null) // { rows, headers, fileName }
  const [mapConfig, setMapConfig] = useState(null) // { mapping, repColumns }
  const [lockSettings, setLockSettings] = useState(DEFAULT_SETTINGS)
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [tolerancePercent, setTolerancePercent] = useState(DEFAULT_TOLERANCE_PERCENT)
  const [overrides, setOverrides] = useState({}) // { [groupId]: { [role]: repName } }

  const handleUploaded = (data) => {
    setUpload(data)
    setMapConfig(null)
    setStep('mapping')
  }

  const handleMapped = (config) => {
    setMapConfig(config)
    setLockSettings(DEFAULT_SETTINGS)
    setWeights(DEFAULT_WEIGHTS)
    setTolerancePercent(DEFAULT_TOLERANCE_PERCENT)
    setOverrides({})
    setStep('report')
  }

  const repRoles = useMemo(() => {
    if (!mapConfig) return []
    return Array.from(new Set(mapConfig.repColumns.map((rc) => rc.label || rc.column)))
  }, [mapConfig])

  const accounts = useMemo(() => {
    if (!upload || !mapConfig) return []
    return normalizeAccounts(upload.rows, mapConfig.mapping, mapConfig.repColumns)
  }, [upload, mapConfig])

  // Recomputed here (not inside ReportPage) so Pass 2/3 see exactly the
  // same locked/unlocked determination the user reviewed.
  const report = useMemo(() => {
    if (accounts.length === 0) return null
    return buildReport(accounts, lockSettings)
  }, [accounts, lockSettings])

  // Computed once here (not inside BalancePage) so Pass 3's final report
  // works from the exact same recommendation the user reviewed on the
  // Balance screen, with overrides layered strictly on top of it.
  const balance = useMemo(() => {
    if (!report || !mapConfig) return null
    return runBalance({ report, accounts, mapping: mapConfig.mapping, repRoles, weights, tolerancePercent })
  }, [report, accounts, mapConfig, repRoles, weights, tolerancePercent])

  if (step === 'finalReport' && upload && mapConfig && report && balance) {
    return (
      <FinalReportPage
        report={report}
        accounts={accounts}
        mapping={mapConfig.mapping}
        repColumns={mapConfig.repColumns}
        balance={balance}
        overrides={overrides}
        setOverrides={setOverrides}
        fileName={upload.fileName}
        onBack={() => setStep('balance')}
      />
    )
  }

  if (step === 'balance' && upload && mapConfig && report && balance) {
    return (
      <BalancePage
        report={report}
        accounts={accounts}
        mapping={mapConfig.mapping}
        repColumns={mapConfig.repColumns}
        balance={balance}
        weights={weights}
        onWeightsChange={setWeights}
        tolerancePercent={tolerancePercent}
        onToleranceChange={setTolerancePercent}
        fileName={upload.fileName}
        onBack={() => setStep('report')}
        onContinue={() => setStep('finalReport')}
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
