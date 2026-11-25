// src/App.jsx
import { useState } from 'react'
import Header             from './components/Header'
import SensorGrid         from './components/SensorGrid'
import SensorDetailChart  from './components/SensorDetailChart'
import PlantCameraSection from './components/PlantCameraSection'
import WaterChemistryChart   from './components/WaterChemistryChart'
import EnvironmentalChart    from './components/EnvironmentalChart'
import ControlPanel       from './components/ControlPanel'
import SystemLogs         from './components/SystemLogs'
import ThresholdSettings  from './components/ThresholdSettings'
import DownloadButton     from './components/DownloadButton'
import AboutProjectAndTeam from './components/AboutProjectAndTeam'
import AIChatBot          from './components/AIChatBot'
import { useSensorData }  from './hooks/useSensorData'
import { useThresholds }  from './hooks/useThresholds'
import { usePlantCamera } from './hooks/usePlantCamera'
import { useTheme }       from './hooks/useTheme'

function App() {
  const {
    latest, previous, history, logs,
    isConnected, lastUpdated, addLog,
    dataSourceMode, toggleDataMode,
  } = useSensorData()

  const {
    thresholds, getStatus, updateThreshold,
    saveThresholds, resetThresholds, saving, saveStatus,
  } = useThresholds()

  const {
    latestPhoto, gallery, isLoading: camLoading,
    isCapturing, triggerCapture,
  } = usePlantCamera(addLog)

  const { theme, toggleTheme, isDark } = useTheme()

  const [selectedSensor, setSelectedSensor] = useState(null)

  const isSim = dataSourceMode === 'simulation'

  return (
    <div
      className="min-h-screen transition-colors duration-300 p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-slate-100"
      style={{
        backgroundImage: isDark
          ? 'radial-gradient(ellipse at top, rgba(16,185,129,0.05) 0%, #09090b 70%)'
          : 'radial-gradient(ellipse at top, rgba(16,185,129,0.08) 0%, #f8fafc 70%)',
      }}
    >
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header with Theme Switcher & Notification Controls */}
        <Header
          isConnected={isConnected}
          lastUpdated={lastUpdated}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* ─── Hero / Project Overview Landing ─── */}
        <AboutProjectAndTeam />

        {/* Top Info Bar & Download Row */}
        <div id="sensor-grid" className="flex items-center justify-between flex-wrap gap-2 px-1 pt-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-semibold text-slate-700 dark:text-zinc-400">{history.length} readings</span>
            <span>stored in memory ({isSim ? 'Calibrated Simulation' : 'Live Hardware Stream'})</span>
          </div>
          <DownloadButton history={history} />
        </div>

        {/* Sensor Cards Grid */}
        <SensorGrid
          latest={latest}
          previous={previous}
          getStatus={getStatus}
          isConnected={isConnected}
          selectedSensor={selectedSensor}
          onSensorSelect={setSelectedSensor}
        />

        {/* Single Sensor Detail Chart (Tapped Sensor - Graph Active Below) */}
        {selectedSensor && (
          <SensorDetailChart
            sensorKey={selectedSensor}
            history={history}
            onClose={() => setSelectedSensor(null)}
          />
        )}

        {/* ─── Plant Vision & Camera Growth Monitoring Section ─── */}
        <PlantCameraSection
          latestPhoto={latestPhoto}
          gallery={gallery}
          isLoading={camLoading}
          isCapturing={isCapturing}
          onCaptureNow={triggerCapture}
        />

        {/* Charts Row */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-500 dark:text-zinc-400 tracking-widest uppercase">
              Analytics &amp; Time-Series
            </h2>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
              {isSim ? 'Ideal Lettuce Telemetry Stream' : 'Live Hardware Ingestion'}
            </span>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <WaterChemistryChart history={history} />
            <EnvironmentalChart  history={history} />
          </div>
        </section>

        {/* Thresholds + Logs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-500 dark:text-zinc-400 tracking-widest uppercase">
              Alert Settings &amp; System Events
            </h2>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">Hardware Sync</span>
          </div>
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

        {/* Control Panel */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-500 dark:text-zinc-400 tracking-widest uppercase">
              Control Panel &amp; System Overview
            </h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ControlPanel addLog={addLog} />
            <div className="glass-card p-6 flex flex-col justify-center items-center gap-3 text-center border border-emerald-200/70 dark:border-zinc-800/80 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                  <path
                    d="M12 2C12 2 5 9.5 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 9.5 12 2 12 2Z"
                    className="fill-emerald-500/20 dark:fill-emerald-400/30"
                    stroke="#059669"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 15C9 15 9.5 17.5 12 17.5"
                    stroke="#059669"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  Nutri<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 font-medium">
                  Smart IoT Hydroponic Monitoring System
                </p>
                <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400 dark:text-zinc-500 font-mono">
                  <span>ESP32-S3 CAM</span> · <span>MongoDB Atlas</span> · <span>7 Sensors</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer with Minimalist Toggle Button on the Side */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-zinc-600 pt-4 pb-2 border-t border-slate-200/60 dark:border-zinc-800/60">
          <p className="font-mono">
            NutriFlow v2.5 · Plant Vision &amp; Hydroponic Core · {new Date().getFullYear()}
          </p>

          {/* Simple Minimalist Toggle Button on the side */}
          <button
            onClick={() => toggleDataMode()}
            className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono border border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-500 text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 transition shadow-sm active:scale-95"
            title="Toggle between Real ESP32 Data and Demo Stream"
          >
            <span className={`w-2 h-2 rounded-full ${isSim ? 'bg-amber-400' : 'bg-emerald-500'}`} />
            <span>Mode: {isSim ? 'Demo' : 'Real Hardware'}</span>
          </button>
        </footer>

      </div>

      {/* ─── Floating NutriBot AI Agronomist Chat Widget ─── */}
      <AIChatBot liveSensors={latest} />

    </div>
  )
}

export default App
