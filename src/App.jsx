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
import { Radio, Cpu, Sparkles } from 'lucide-react'

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

        {/* ─── LIVE DATA MODE TOGGLE CONTROL (AT THE VERY END) ─── */}
        <section className="pt-2">
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-lg flex flex-col md:flex-row items-center justify-between gap-5 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white">
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10 shrink-0">
                {isSim ? <Sparkles className="w-6 h-6 text-amber-300" /> : <Cpu className="w-6 h-6 text-emerald-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-white">Telemetry Data Mode Controller</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isSim ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                  }`}>
                    {isSim ? '🌱 Ideal Lettuce Simulation Active' : '⚡ Real Hardware (ESP32 / DB) Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Toggle between <strong>Ideal Lettuce Simulation</strong> (scientifically optimal dynamic graphs with realistic micro-drifts for demo/presentation) and <strong>Real Hardware Mode</strong> (direct live ESP32 status and raw sensor values from MongoDB).
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3 shrink-0 bg-slate-800/80 p-2 rounded-2xl border border-slate-700">
              <button
                onClick={() => toggleDataMode('hardware')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  !isSim
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Real Hardware ESP32</span>
              </button>

              <button
                onClick={() => toggleDataMode('simulation')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isSim
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-white shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Ideal Lettuce Demo</span>
              </button>
            </div>

          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 dark:text-zinc-600 pb-3 font-mono">
          NutriFlow v2.5 · Plant Vision &amp; Hydroponic Core · {new Date().getFullYear()}
        </footer>

      </div>

      {/* ─── Floating NutriBot AI Agronomist Chat Widget ─── */}
      <AIChatBot liveSensors={latest} />

    </div>
  )
}

export default App
