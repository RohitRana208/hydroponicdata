// src/components/CameraGallery.jsx — ESP32-S3 CAM Live Feed & Historical Gallery
import { useState } from 'react'
import {
  Camera, RefreshCw, Maximize2, Download, Trash2,
  Clock, HardDrive, Sparkles, X, AlertCircle, CheckCircle2,
  Layers, Play, Pause, ExternalLink
} from 'lucide-react'
import { useGallery } from '../hooks/useGallery'

const formatTimeAgo = (date) => {
  if (!date) return 'Unknown'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Unknown'

  const sec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDateTime = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '—'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const CameraGallery = () => {
  const {
    images,
    latestImage,
    historicalImages,
    loading,
    error,
    autoPoll,
    setAutoPoll,
    lastRefreshed,
    refetch,
    deleteImage,
    addSampleSnapshot,
  } = useGallery()

  const [lightboxImg, setLightboxImg] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [addingMock, setAddingMock] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this snapshot?')) return
    setDeletingId(id)
    await deleteImage(id)
    if (lightboxImg?._id === id) setLightboxImg(null)
    setDeletingId(null)
  }

  const handleSimulate = async () => {
    setAddingMock(true)
    await addSampleSnapshot()
    setAddingMock(false)
  }

  const copyUploadUrl = () => {
    const url = `${window.location.origin}/api/gallery/upload`
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2500)
  }

  return (
    <section className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
              Plant Growth Cam · Live Feed
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              ESP32-S3 Autonomous 15-Minute Canopy Snapshots
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Auto-poll status */}
          <button
            onClick={() => setAutoPoll(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-all ${
              autoPoll
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
            }`}
            title="Toggle 30s auto polling"
          >
            {autoPoll ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
            {autoPoll ? 'Auto-Polling (30s)' : 'Polling Paused'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            Refresh
          </button>

          {/* Simulate Test Upload */}
          <button
            onClick={handleSimulate}
            disabled={addingMock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium transition-all"
            title="Generate a sample test snapshot"
          >
            <Sparkles className="w-3 h-3" />
            {addingMock ? 'Simulating…' : 'Simulate Cam Capture'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {images.length === 0 && !loading ? (
        /* Empty State */
        <div className="glass-card p-8 text-center flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Camera className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              No Camera Snapshots Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Your ESP32-S3 CAM will push JPEG snapshots every 15 minutes directly to this endpoint:
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 max-w-lg w-full justify-between">
            <span className="truncate">{window.location.origin}/api/gallery/upload</span>
            <button
              onClick={copyUploadUrl}
              className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 shrink-0 font-sans text-xs underline"
            >
              {copiedUrl ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <button
            onClick={handleSimulate}
            disabled={addingMock}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {addingMock ? 'Adding...' : 'Add Sample Plant Snapshot'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left / Top: Latest Live Feed Showcase (7 cols on lg) */}
          {latestImage && (
            <div className="lg:col-span-7 flex flex-col">
              <div className="glass-card overflow-hidden rounded-2xl flex flex-col h-full border border-slate-200/80 dark:border-zinc-800">
                {/* Showcase Header */}
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Latest Feed
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {formatTimeAgo(latestImage.capturedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLightboxImg(latestImage)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                      title="Fullscreen Preview"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <a
                      href={latestImage.imageUrl}
                      download={`esp32_cam_${latestImage._id}.jpg`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                      title="Download Image"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Featured Image Frame */}
                <div
                  onClick={() => setLightboxImg(latestImage)}
                  className="relative group cursor-pointer bg-slate-950 flex items-center justify-center aspect-[4/3] sm:aspect-[16/10] overflow-hidden"
                >
                  <img
                    src={latestImage.imageUrl}
                    alt="Latest Hydroponic Canopy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="eager"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-xs text-slate-100 flex items-center gap-1.5 font-medium">
                      <Maximize2 className="w-3.5 h-3.5" /> Tap to view high-resolution image
                    </span>
                  </div>
                </div>

                {/* Showcase Footer Meta */}
                <div className="px-5 py-3 bg-white/80 dark:bg-zinc-900/60 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      {formatDateTime(latestImage.capturedAt)}
                    </span>
                    <span className="font-mono text-slate-400 dark:text-zinc-600">·</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      {latestImage.device || 'ESP32-S3-CAM'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                    {formatBytes(latestImage.sizeBytes)} · {latestImage.resolution || 'VGA'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Right: Historical Grid (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="glass-card p-5 rounded-2xl flex flex-col h-full border border-slate-200/80 dark:border-zinc-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Snapshot History ({images.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Every 15 min
                </span>
              </div>

              {/* Scrollable Mini Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 overflow-y-auto max-h-[420px] pr-1">
                {images.map((img, idx) => (
                  <div
                    key={img._id || idx}
                    onClick={() => setLightboxImg(img)}
                    className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 cursor-pointer border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all shadow-sm"
                  >
                    <img
                      src={img.imageUrl}
                      alt={`Snapshot ${idx}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Timestamp chip */}
                    <div className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-[10px] text-slate-200 font-mono px-1.5 py-0.5 rounded">
                      {formatTimeAgo(img.capturedAt)}
                    </div>

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setLightboxImg(img)
                        }}
                        className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/40 transition-all"
                        title="Expand"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, img._id)}
                        disabled={deletingId === img._id}
                        className="p-1.5 rounded-lg bg-rose-500/40 text-white hover:bg-rose-500/70 transition-all"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-slate-100">
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold">
                  Canopy Snapshot · {formatDateTime(lightboxImg.capturedAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImg.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-medium transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save HD
                </a>
                <button
                  onClick={() => setLightboxImg(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image Preview */}
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={lightboxImg.imageUrl}
                alt="Enlarged canopy view"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Device: {lightboxImg.device || 'ESP32-S3-CAM'}</span>
              <span>Size: {formatBytes(lightboxImg.sizeBytes)} · {lightboxImg.resolution || 'VGA (640x480)'}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default CameraGallery
