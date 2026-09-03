// src/components/ControlPanel.jsx
import { useState } from 'react'
import { Target, CheckCircle2, AlertCircle, Loader2, Sliders } from 'lucide-react'
// import { updateTargetPh } from '../api/sensorApi'   // ← uncomment for real API

const ControlPanel = ({ addLog }) => {
  const [targetPh, setTargetPh] = useState('7.0')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)  // 'success' | 'error' | null

  const handleUpdate = async () => {
    const val = parseFloat(targetPh)
    if (isNaN(val) || val < 0 || val > 14) {
      setFeedback('error')
      setTimeout(() => setFeedback(null), 3000)
      return
    }

    setSaving(true)
    setFeedback(null)

    // ── REAL API (uncomment when backend is ready) ──────────────────────────
    // try {
    //   await updateTargetPh(val)
    //   addLog('info', `Target pH updated to ${val.toFixed(2)} via keypad.`)
    //   setFeedback('success')
    // } catch (err) {
    //   addLog('error', `Failed to update target pH: ${err.message}`)
    //   setFeedback('error')
    // } finally {
    //   setSaving(false)
    //   setTimeout(() => setFeedback(null), 3000)
    // }

    // ── MOCK ────────────────────────────────────────────────────────────────
    await new Promise(r => setTimeout(r, 800))
    addLog('info', `Target pH updated to ${val.toFixed(2)} via control panel.`)
    setFeedback('success')
    setSaving(false)
    setTimeout(() => setFeedback(null), 3000)
  }

  const quickTargets = ['6.5', '7.0', '7.2', '7.5']

  return (
    <div className="glass-card p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center">
          <Sliders className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Control Panel</h3>
          <p className="text-xs text-zinc-500">Target pH Setpoint</p>
        </div>
      </div>

      {/* Target pH setter */}
      <div className="flex flex-col gap-3">
        <label className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
          pH Setpoint (0 – 14)
        </label>

        {/* Quick select buttons */}
        <div className="grid grid-cols-4 gap-2">
          {quickTargets.map((qt) => (
            <button
              key={qt}
              onClick={() => setTargetPh(qt)}
              className={`text-xs font-semibold py-1.5 rounded-lg border transition-all duration-150 ${
                targetPh === qt
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {qt}
            </button>
          ))}
        </div>

        {/* Manual input + submit */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Target className="w-3.5 h-3.5 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="number"
              value={targetPh}
              onChange={(e) => setTargetPh(e.target.value)}
              min={0}
              max={14}
              step={0.1}
              placeholder="7.0"
              className="input-dark w-full pl-8 pr-3"
            />
          </div>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="btn-primary flex items-center gap-2 min-w-[110px] justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null}
            {saving ? 'Sending…' : 'Update Target'}
          </button>
        </div>

        {/* Feedback */}
        {feedback === 'success' && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            Target pH updated successfully.
          </div>
        )}
        {feedback === 'error' && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            Invalid pH value. Enter a number between 0 and 14.
          </div>
        )}
      </div>

      {/* System info */}
      <div className="border-t border-zinc-800/60 pt-4 grid grid-cols-2 gap-3">
        {[
          { label: 'Poll Interval', value: '3s' },
          { label: 'Data Points', value: '30 max' },
          { label: 'Protocol', value: 'HTTP/REST' },
          { label: 'Endpoint', value: '/api/sensors' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-800/30 rounded-lg px-3 py-2">
            <p className="text-xs text-zinc-600 mb-0.5">{label}</p>
            <p className="text-xs font-mono text-zinc-300">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ControlPanel
