// src/components/PlantCameraSection.jsx
import { useState } from 'react'
import {
  Camera, RefreshCw, Maximize2, X, Sparkles,
  Clock, Image as ImageIcon, CheckCircle2, AlertCircle
} from 'lucide-react'

const PlantCameraSection = ({
  latestPhoto,
  gallery = [],
  isLoading,
  isCapturing,
  onCaptureNow,
}) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [fullscreenImage, setFullscreenImage] = useState(null)

  // Current active preview image (either selected from gallery or latest)
  const activePhoto = selectedImage || latestPhoto

  const formatPhotoTime = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? '—' : d.toLocaleString([], {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    } catch (_) {
      return '—'
    }
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      return `${Math.floor(diffHours / 24)}d ago`
    } catch (_) {
      return ''
    }
  }

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shadow-sm">
            <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Plant Vision &amp; Growth Monitor
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              ESP32-S3 Camera Feed · Auto 30-min Snapshots · 48h Growth Gallery
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <span className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/60 px-3 py-1.5 rounded-full border border-slate-200 dark:border-zinc-700/50">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Auto Snapshot: <span className="font-bold text-slate-800 dark:text-slate-200">Every 30m</span>
          </span>

          <button
            onClick={onCaptureNow}
            disabled={isCapturing}
            className={`btn-primary flex items-center gap-2 text-xs font-bold ${
              isCapturing ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            {isCapturing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Capturing Photo…</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Take Live Photo Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Live Snapshot on Left, Growth Gallery on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── Main Plant Photo Card (Left - 7 cols) ── */}
        <div className="lg:col-span-7 glass-card p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="status-badge bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {selectedImage ? 'Historical Snapshot' : 'Latest Live Snapshot'}
              </span>
              {activePhoto?.trigger === 'manual_request' && (
                <span className="status-badge bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-[10px] font-mono">
                  Manual Trigger
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedImage && (
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium underline"
                >
                  Back to Latest
                </button>
              )}
              {activePhoto?.image && (
                <button
                  onClick={() => setFullscreenImage(activePhoto.image)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-all"
                  title="View Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Photo Display Viewport */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-center group shadow-inner">
            {activePhoto?.image ? (
              <>
                <img
                  src={activePhoto.image}
                  alt="Hydroponic Plant Snapshot"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                  onClick={() => setFullscreenImage(activePhoto.image)}
                />

                {/* Overlay details */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white flex items-end justify-between">
                  <div>
                    <p className="text-xs font-mono font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {formatPhotoTime(activePhoto.createdAt)}
                    </p>
                    <p className="text-[11px] text-zinc-300 mt-0.5">
                      {timeAgo(activePhoto.createdAt)} · Size: {activePhoto.sizeKB || 32} KB · Resolution: SVGA
                    </p>
                  </div>
                  <button
                    onClick={() => setFullscreenImage(activePhoto.image)}
                    className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-[11px] font-semibold border border-white/30 transition-all flex items-center gap-1"
                  >
                    <Maximize2 className="w-3 h-3" /> Full View
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-400 dark:text-zinc-500 font-mono">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-emerald-500 dark:text-emerald-400 opacity-60" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                    Waiting for first ESP32 Camera snapshot…
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-sm">
                    ESP32-S3 camera code flash karne par yahan har 30 minute mein automatically plant growth photo aayegi.
                  </p>
                </div>
                <button
                  onClick={onCaptureNow}
                  className="mt-2 btn-primary text-xs font-bold flex items-center gap-2"
                >
                  <Camera className="w-3.5 h-3.5" /> Take Test Snapshot
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 48-Hour Growth Gallery (Right - 5 cols) ── */}
        <div className="lg:col-span-5 glass-card p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                Growth Timelapse Gallery
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              {gallery.length} Snapshots
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Click any thumbnail below to inspect plant health and leaf growth at that time:
          </p>

          {/* Thumbnails grid / scroll area */}
          <div className="flex-1 overflow-y-auto max-h-[380px] grid grid-cols-2 sm:grid-cols-3 gap-2.5 pr-1">
            {gallery.length === 0 ? (
              <div className="col-span-full h-44 flex flex-col items-center justify-center text-center text-xs font-mono text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-4">
                <ImageIcon className="w-6 h-6 text-slate-300 dark:text-zinc-600 mb-1" />
                <span>Gallery snapshots will appear here automatically every 30 minutes.</span>
              </div>
            ) : (
              gallery.map((item, idx) => {
                const isSelected = (selectedImage?._id === item._id) || (!selectedImage && latestPhoto?._id === item._id && idx === 0)
                return (
                  <div
                    key={item._id || idx}
                    onClick={() => setSelectedImage(item)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 aspect-[4/3] bg-slate-100 dark:bg-zinc-950 group ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-500/60'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={`Snapshot ${idx}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-[9px] font-mono text-white flex items-center justify-between">
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-emerald-400 font-semibold">{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* ── Fullscreen Modal View ── */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setFullscreenImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/90 text-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold">NutriFlow High-Definition Plant Snapshot</span>
              </div>
              <button
                onClick={() => setFullscreenImage(null)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-hidden">
              <img
                src={fullscreenImage}
                alt="Plant Fullscreen HD"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PlantCameraSection
