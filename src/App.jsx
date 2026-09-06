// src/App.jsx
import { useState } from 'react'
import Header             from './components/Header'
import SensorGrid         from './components/SensorGrid'
import SensorDetailChart  from './components/SensorDetailChart'
import CameraGallery      from './components/CameraGallery'
import WaterChemistryChart   from './components/WaterChemistryChart'
import EnvironmentalChart    from './components/EnvironmentalChart'
import ControlPanel       from './components/ControlPanel'
import SystemLogs         from './components/SystemLogs'
import ThresholdSettings  from './components/ThresholdSettings'
import DownloadButton     from './components/DownloadButton'
import { useSensorData }  from './hooks/useSensorData'
import { useThresholds }  from './hooks/useThresholds'
import { useTheme }       from './hooks/useTheme'

function App() {
  const {
    latest, previous, history, logs,
    isConnected, lastUpdated, addLog,
  } = useSensorData()

  const {
    thresholds, getStatus, updateThreshold,
    saveThresholds, resetThresholds, saving, saveStatus,
  } = useThresholds()

  const { theme, isDark, toggleTheme } = useTheme()
  const [selectedSensor, setSelectedSensor] = useState(null)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-slate-100 p-4 md:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* ─── Header with Theme Switcher ─────────────────────────────── */}
        <Header
          isConnected={isConnected}
          lastUpdated={lastUpdated}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* ─── Download & Status Row ──────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <div className="text-xs text-slate-500 dark:text-zinc-500 tabular-nums">
            {history.length} telemetry readings in memory
            {history.length > 0 && ` · ${new Date(history[0]?.rawTime).toLocaleDateString()} → Live`}
          </div>
          <DownloadButton history={history} />
        </div>

        {/* ─── Sensor Cards Grid ──────────────────────────────────────── */}
        <SensorGrid
          latest={latest}
          previous={previous}
          getStatus={getStatus}
          isConnected={isConnected}
          selectedSensor={selectedSensor}
          onSensorSelect={setSelectedSensor}
        />

        {/* ─── Single Sensor Detail Chart (Tapped Sensor View) ─────────── */}
        {selectedSensor && (
          <SensorDetailChart
            sensorKey={selectedSensor}
            history={history}
            onClose={() => setSelectedSensor(null)}
          />
        )}

        {/* ─── ESP32-S3 CAM Gallery & Live Feed ────────────────────────── */}
        <CameraGallery />

        {/* ─── Analytics & Time-Series Charts ─────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-zinc-400 tracking-widest uppercase mb-4">
            Analytics &amp; Time-Series
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <WaterChemistryChart history={history} />
            <EnvironmentalChart  history={history} />
          </div>
        </section>

        {/* ─── Thresholds & System Logs ────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-zinc-400 tracking-widest uppercase mb-4">
            Alert Settings &amp; System Events
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ThresholdSettings
              thresholds={thresholds}
              updateThreshold={updateThreshold}
              saveThresholds={saveThresholds}
              resetThresholds={resetThresholds}
              saving={saving}
              saveStatus={saveStatus}
            />
            <SystemLogs logs={logs} />
          </div>
        </section>

        {/* ─── Control Panel & Info ────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-zinc-400 tracking-widest uppercase mb-4">
            Control Panel &amp; System Info
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ControlPanel addLog={addLog} />
            <div className="glass-card p-5 flex flex-col justify-center items-center gap-3 text-center border border-slate-200/80 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                  <path d="M12 2C12 2 5 9.5 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 9.5 12 2 12 2Z"
                    fill="rgba(16,185,129,0.25)" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M9 15C9 15 9.5 17.5 12 17.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Nutri<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">Smart IoT Hydroponics Monitoring v2.5</p>
                <p className="text-xs text-slate-400 dark:text-zinc-600 mt-3 font-mono">
                  ESP32-S3 CAM · MongoDB Atlas · 7 Sensors + Camera Gallery
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <footer className="text-center text-xs text-slate-400 dark:text-zinc-600 pb-2 font-mono">
          NutriFlow v2.5 · White &amp; Green Theme · {new Date().getFullYear()}
        </footer>

      </div>
    </div>
  )
}

export default App
