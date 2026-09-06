// src/components/ThresholdSettings.jsx
import { useState } from 'react'
import {
  Bell, BellOff, RotateCcw, Save, CheckCircle2,
  AlertCircle, WifiOff, ChevronDown, ChevronUp, Sliders,
  Droplets, Gauge, Thermometer, Wind, CloudRain, Ruler, Zap,
} from 'lucide-react'
import { DEFAULT_THRESHOLDS } from '../hooks/useThresholds'

const SENSOR_META = {
  ph:         { icon: Droplets,    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20', step: 0.1, absMin: 0,   absMax: 14   },
  tds:        { icon: Gauge,       color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/20',   step: 10,  absMin: 0,   absMax: 1000 },
  ec:         { icon: Zap,         color: 'text-amber-600 dark:text-yellow-400',  bg: 'bg-amber-50 border-amber-200 dark:bg-yellow-500/10 dark:border-yellow-500/20',   step: 0.1, absMin: 0,   absMax: 10   },
  waterTemp:  { icon: Thermometer, color: 'text-sky-600 dark:text-sky-400',     bg: 'bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20',         step: 0.5, absMin: 0,   absMax: 50   },
  airTemp:    { icon: Wind,        color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20',   step: 0.5, absMin: -10, absMax: 60   },
  humidity:   { icon: CloudRain,   color: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-500/10 dark:border-cyan-500/20',       step: 1,   absMin: 0,   absMax: 100  },
  waterLevel: { icon: Ruler,       color: 'text-teal-600 dark:text-teal-400',    bg: 'bg-teal-50 border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/20',       step: 0.5, absMin: 0,   absMax: 400  },
}

const ThresholdRow = ({ sensorKey, threshold, meta, onToggle, onChange }) => {
  const [open, setOpen] = useState(false)
  if (!threshold) return null

  const safeMeta = meta || {
    icon: Zap,
    color: 'text-amber-600 dark:text-yellow-400',
    bg: 'bg-amber-50 border-amber-200 dark:bg-yellow-500/10 dark:border-yellow-500/20',
    step: 0.1,
    absMin: 0,
    absMax: 100,
  }
  const Icon = safeMeta.icon

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${
      threshold.enabled
        ? 'bg-slate-50/80 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-700/60 shadow-sm'
        : 'bg-slate-100/40 dark:bg-zinc-900/30 border-slate-200/50 dark:border-zinc-800/40 opacity-60'
    }`}>

      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-sm ${safeMeta.bg}`}>
          <Icon className={`w-4 h-4 ${safeMeta.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{threshold.label}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-500 tabular-nums">
            {threshold.enabled
              ? `Alert: ${threshold.min} – ${threshold.max} ${threshold.unit}`
              : 'Alert disabled'}
          </p>
        </div>

        {/* Current range pills */}
        {threshold.enabled && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 font-mono font-semibold border border-sky-200 dark:border-sky-500/20">
              Min: {threshold.min}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-mono font-semibold border border-rose-200 dark:border-rose-500/20">
              Max: {threshold.max}
            </span>
          </div>
        )}

        {/* Toggle enable */}
        <button
          onClick={() => onToggle(sensorKey)}
          className={`p-1.5 rounded-lg transition-all ${
            threshold.enabled
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
              : 'text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-800/40 hover:text-slate-600 dark:hover:text-zinc-400'
          }`}
          title={threshold.enabled ? 'Disable alert' : 'Enable alert'}
        >
          {threshold.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>

        {/* Expand toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-all"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded editor */}
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-200/80 dark:border-zinc-800/60 space-y-4 bg-white/70 dark:bg-zinc-950/40">
          <div className="grid grid-cols-2 gap-4">
            {/* Min */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                Min Value
              </label>
              <input
                type="number"
                value={threshold.min}
                step={safeMeta.step}
                min={safeMeta.absMin}
                max={threshold.max - safeMeta.step}
                onChange={e => onChange(sensorKey, 'min', parseFloat(e.target.value))}
                className="input-dark w-full text-sky-700 dark:text-sky-300 font-mono font-bold"
              />
              <input
                type="range"
                value={threshold.min}
                step={safeMeta.step}
                min={safeMeta.absMin}
                max={threshold.max - safeMeta.step}
                onChange={e => onChange(sensorKey, 'min', parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Max */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                Max Value
              </label>
              <input
                type="number"
                value={threshold.max}
                step={safeMeta.step}
                min={threshold.min + safeMeta.step}
                max={safeMeta.absMax}
                onChange={e => onChange(sensorKey, 'max', parseFloat(e.target.value))}
                className="input-dark w-full text-rose-700 dark:text-rose-300 font-mono font-bold"
              />
              <input
                type="range"
                value={threshold.max}
                step={safeMeta.step}
                min={threshold.min + safeMeta.step}
                max={safeMeta.absMax}
                onChange={e => onChange(sensorKey, 'max', parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Visual range bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-600 font-mono">
              <span>{safeMeta.absMin}</span>
              <span className="text-slate-600 dark:text-zinc-400 font-medium">Normal Range → {threshold.min} to {threshold.max} {threshold.unit}</span>
              <span>{safeMeta.absMax}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-zinc-800 relative overflow-hidden">
              {/* Warning zones */}
              <div className="absolute inset-y-0 bg-rose-500/25 rounded-full"
                style={{ left: 0, right: `${Math.max(0, 100 - (threshold.min / safeMeta.absMax) * 100)}%` }} />
              {/* Normal zone */}
              <div className="absolute inset-y-0 bg-emerald-500/40 rounded-full"
                style={{
                  left:  `${Math.max(0, (threshold.min / safeMeta.absMax) * 100)}%`,
                  right: `${Math.max(0, 100 - (threshold.max / safeMeta.absMax) * 100)}%`
                }} />
              {/* Right warning */}
              <div className="absolute inset-y-0 bg-rose-500/25 rounded-full"
                style={{ left: `${Math.min(100, (threshold.max / safeMeta.absMax) * 100)}%`, right: 0 }} />
            </div>
            <div className="flex justify-between text-[10px] font-medium">
              <span className="text-rose-600 dark:text-rose-400">⚠ Below {threshold.min}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Normal</span>
              <span className="text-rose-600 dark:text-rose-400">⚠ Above {threshold.max}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const ThresholdSettings = ({ thresholds = {}, updateThreshold, saveThresholds, resetThresholds, saving, saveStatus }) => {
  const [localThresholds, setLocalThresholds] = useState({ ...DEFAULT_THRESHOLDS, ...thresholds })

  const handleChange = (key, field, value) => {
    setLocalThresholds(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  const handleToggle = (key) => {
    setLocalThresholds(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }))
  }

  const handleSave = () => {
    saveThresholds(localThresholds)
  }

  const handleReset = () => {
    setLocalThresholds({ ...DEFAULT_THRESHOLDS })
    resetThresholds()
  }

  const statusMsg = {
    success: { text: '✅ Saved! ESP32 will update in next poll.', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/25' },
    offline: { text: '💾 Saved locally. Backend offline — ESP32 will sync when server is back.', cls: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/25' },
    error:   { text: '❌ Save failed. Check server connection.', cls: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/25' },
  }

  return (
    <div className="glass-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl flex items-center justify-center shadow-sm">
            <Sliders className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Alert Thresholds</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-500">Set karo — dashboard + hardware mein apply hoga</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700/40 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 text-xs font-bold disabled:opacity-60"
          >
            {saving ? (
              <span className="w-3 h-3 border border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? 'Saving…' : 'Save Alerts'}
          </button>
        </div>
      </div>

      {/* Rows */}
      <div className="p-4 space-y-2.5 overflow-y-auto max-h-[600px]">
        {Object.entries(localThresholds).map(([key, threshold]) => (
          <ThresholdRow
            key={key}
            sensorKey={key}
            threshold={threshold}
            meta={SENSOR_META[key]}
            onToggle={handleToggle}
            onChange={handleChange}
          />
        ))}
      </div>

      {/* Save status */}
      {saveStatus && statusMsg[saveStatus] && (
        <div className={`mx-4 mb-4 rounded-xl px-4 py-2.5 text-xs font-semibold border shadow-sm ${statusMsg[saveStatus].cls}`}>
          {statusMsg[saveStatus].text}
        </div>
      )}

      {/* Footer info */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center gap-2 text-[11px] text-slate-400 dark:text-zinc-600">
        <Bell className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-700" />
        <span>ESP32 polls <span className="font-mono font-semibold text-slate-600 dark:text-zinc-500">/api/sensors/thresholds</span> every 30s to sync hardware alerts</span>
      </div>
    </div>
  )
}

export default ThresholdSettings
