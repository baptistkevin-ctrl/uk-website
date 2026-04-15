'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/* ─── Types ───────────────────────────────────────────────── */

interface BarcodeScannerProps {
  onScan: (value: string) => void
  onClose: () => void
}

type ScannerStatus = 'initializing' | 'scanning' | 'unsupported' | 'denied' | 'detected'

/* ─── BarcodeDetector type shim ───────────────────────────── */

interface DetectedBarcode {
  rawValue: string
  format: string
  boundingBox: DOMRectReadOnly
}

declare global {
  interface Window {
    BarcodeDetector: {
      new (options?: { formats: string[] }): {
        detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>
      }
      getSupportedFormats: () => Promise<string[]>
    }
  }
}

/* ─── Component ───────────────────────────────────────────── */

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)

  const [status, setStatus] = useState<ScannerStatus>('initializing')
  const [detectedValue, setDetectedValue] = useState('')
  const [manualValue, setManualValue] = useState('')
  const [torchOn, setTorchOn] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const [hasBarcodeApi, setHasBarcodeApi] = useState(false)

  /* ── Check BarcodeDetector support ── */
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' && 'BarcodeDetector' in window
    setHasBarcodeApi(supported)
  }, [])

  /* ── Start camera ── */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Check torch capability
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
      if (capabilities.torch) {
        setHasTorch(true)
      }

      setStatus('scanning')
    } catch (err) {
      const error = err as DOMException
      if (error.name === 'NotAllowedError') {
        setStatus('denied')
      } else {
        setStatus('unsupported')
      }
    }
  }, [])

  /* ── Stop camera ── */
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  /* ── Toggle torch ── */
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    const newTorchState = !torchOn

    try {
      await track.applyConstraints({
        advanced: [{ torch: newTorchState } as MediaTrackConstraintSet],
      })
      setTorchOn(newTorchState)
    } catch {
      // Torch not supported on this device
    }
  }, [torchOn])

  /* ── Start barcode detection loop ── */
  useEffect(() => {
    if (status !== 'scanning' || !hasBarcodeApi) return

    const detector = new window.BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'qr_code'],
    })

    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect)
        return
      }

      try {
        const barcodes = await detector.detect(videoRef.current)
        if (barcodes.length > 0) {
          const barcode = barcodes[0]
          setDetectedValue(barcode.rawValue)
          setStatus('detected')
          stopCamera()
          onScan(barcode.rawValue)
          return
        }
      } catch {
        // Detection frame error, continue scanning
      }

      animFrameRef.current = requestAnimationFrame(detect)
    }

    animFrameRef.current = requestAnimationFrame(detect)

    return () => cancelAnimationFrame(animFrameRef.current)
  }, [status, hasBarcodeApi, onScan, stopCamera])

  /* ── Init camera on mount ── */
  useEffect(() => {
    startCamera()
    return stopCamera
  }, [startCamera, stopCamera])

  /* ── Handle manual submit ── */
  const handleManualSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!manualValue.trim()) return
      setDetectedValue(manualValue.trim())
      setStatus('detected')
      stopCamera()
      onScan(manualValue.trim())
    },
    [manualValue, onScan, stopCamera]
  )

  /* ── Handle close ── */
  const handleClose = useCallback(() => {
    stopCamera()
    onClose()
  }, [stopCamera, onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-(--brand-dark)/80 backdrop-blur-sm">
        <h2 className="text-white font-semibold text-lg">Scan Barcode</h2>
        <div className="flex items-center gap-2">
          {hasTorch && status === 'scanning' && (
            <button
              type="button"
              onClick={toggleTorch}
              className={cn(
                'rounded-lg p-2 transition-colors cursor-pointer',
                torchOn
                  ? 'bg-(--brand-primary) text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
              aria-label={torchOn ? 'Turn off flash' : 'Turn on flash'}
            >
              <FlashIcon />
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close scanner"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Camera viewport */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {(status === 'scanning' || status === 'initializing') && (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Scan guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Darkened edges */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Clear scan area */}
              <div className="relative w-72 h-44">
                <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />

                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-(--brand-primary) rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-(--brand-primary) rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-(--brand-primary) rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-(--brand-primary) rounded-br" />

                {/* Scan line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-(--brand-primary)/80 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>

            {/* Instruction text */}
            <div className="absolute bottom-32 left-0 right-0 text-center">
              <p className="text-white/80 text-sm">
                Point your camera at a barcode
              </p>
            </div>
          </>
        )}

        {/* Detected state */}
        {status === 'detected' && (
          <div className="flex flex-col items-center gap-4 p-6">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/20 px-6 py-3 border border-emerald-500/40">
              <CheckIcon />
              <span className="text-emerald-400 font-semibold text-lg">
                {detectedValue}
              </span>
            </div>
            <p className="text-white/60 text-sm">Barcode detected successfully</p>
          </div>
        )}

        {/* Denied state */}
        {status === 'denied' && (
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="rounded-full bg-red-500/20 p-4">
              <CameraOffIcon />
            </div>
            <p className="text-white font-medium">Camera access denied</p>
            <p className="text-white/60 text-sm max-w-xs">
              Please allow camera access in your browser settings to scan barcodes.
            </p>
          </div>
        )}

        {/* Unsupported state */}
        {status === 'unsupported' && (
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="rounded-full bg-amber-500/20 p-4">
              <CameraOffIcon />
            </div>
            <p className="text-white font-medium">Camera unavailable</p>
            <p className="text-white/60 text-sm max-w-xs">
              Your device does not support camera access. Use manual entry below.
            </p>
          </div>
        )}
      </div>

      {/* Manual entry fallback */}
      <div className="px-4 py-4 bg-(--brand-dark)/80 backdrop-blur-sm">
        {!hasBarcodeApi && status === 'scanning' && (
          <p className="text-amber-400 text-xs text-center mb-2">
            BarcodeDetector API not supported. Using manual entry.
          </p>
        )}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder="Enter barcode manually..."
            className={cn(
              'flex-1 rounded-lg px-4 py-2.5 text-sm',
              'bg-white/10 text-white placeholder:text-white/40',
              'border border-white/20 outline-none',
              'focus:border-(--brand-primary) focus:ring-1 focus:ring-(--brand-primary)/50'
            )}
          />
          <button
            type="submit"
            disabled={!manualValue.trim()}
            className={cn(
              'rounded-lg px-5 py-2.5 text-sm font-medium',
              'bg-(--brand-primary) text-white',
              'hover:bg-(--brand-amber) transition-colors cursor-pointer',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            Submit
          </button>
        </form>
      </div>

      {/* Scan line keyframe injection */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0.5rem; }
          50% { top: calc(100% - 0.5rem); }
        }
      `}</style>
    </div>
  )
}

/* ─── Inline icons ────────────────────────────────────────── */

function FlashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CameraOffIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9.34" />
      <path d="M15 11a3 3 0 0 0-5.94-.5" />
    </svg>
  )
}
