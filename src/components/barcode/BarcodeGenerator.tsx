'use client'

import { useCallback, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'

/* ─── Types ───────────────────────────────────────────────── */

type BarcodeFormat = 'EAN13' | 'CODE128' | 'QR'

interface BarcodeGeneratorProps {
  value: string
  format?: BarcodeFormat
  width?: number
  height?: number
  showValue?: boolean
}

/* ─── Code 128B encoding tables ───────────────────────────── */

const CODE128B_START = 104
const CODE128_STOP = 106

const CODE128_PATTERNS: number[][] = [
  [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
  [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
  [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
  [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
  [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
  [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
  [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
  [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
  [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
  [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
  [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
  [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
  [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
  [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
  [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
  [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
  [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
  [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
  [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
  [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
  [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],
  [2,1,1,4,1,2], // 104 START B
  [2,1,1,2,1,4], // 105 START C
  [2,3,3,1,1,1,2], // 106 STOP (7 elements)
]

/* ─── Encoding helpers ────────────────────────────────────── */

function encodeCode128B(data: string): number[][] {
  const values: number[] = [CODE128B_START]
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i) - 32
    if (code < 0 || code > 95) continue
    values.push(code)
  }

  let checksum = values[0]
  for (let i = 1; i < values.length; i++) {
    checksum += values[i] * i
  }
  values.push(checksum % 103)
  values.push(CODE128_STOP)

  return values.map((v) => CODE128_PATTERNS[v] || [1,1,1,1,1,1])
}

function calculateEan13CheckDigit(digits: number[]): number {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }
  return (10 - (sum % 10)) % 10
}

const EAN_L_PATTERNS: number[][] = [
  [0,0,0,1,1,0,1],[0,0,1,1,0,0,1],[0,0,1,0,0,1,1],[0,1,1,1,1,0,1],
  [0,1,0,0,0,1,1],[0,1,1,0,0,0,1],[0,1,0,1,1,1,1],[0,1,1,1,0,1,1],
  [0,1,1,0,1,1,1],[0,0,0,1,0,1,1],
]

const EAN_R_PATTERNS: number[][] = [
  [1,1,1,0,0,1,0],[1,1,0,0,1,1,0],[1,1,0,1,1,0,0],[1,0,0,0,0,1,0],
  [1,0,1,1,1,0,0],[1,0,0,1,1,1,0],[1,0,1,0,0,0,0],[1,0,0,0,1,0,0],
  [1,0,0,1,0,0,0],[1,1,1,0,1,0,0],
]

const EAN_G_PATTERNS: number[][] = [
  [0,1,0,0,1,1,1],[0,1,1,0,0,1,1],[0,0,1,1,0,1,1],[0,1,0,0,0,0,1],
  [0,0,1,1,1,0,1],[0,1,1,1,0,0,1],[0,0,0,0,1,0,1],[0,0,1,0,0,0,1],
  [0,0,0,1,0,0,1],[0,0,1,0,1,1,1],
]

const EAN_PARITY: number[][] = [
  [0,0,0,0,0,0],[0,0,1,0,1,1],[0,0,1,1,0,1],[0,0,1,1,1,0],
  [0,1,0,0,1,1],[0,1,1,0,0,1],[0,1,1,1,0,0],[0,1,0,1,0,1],
  [0,1,0,1,1,0],[0,1,1,0,1,0],
]

function encodeEan13(data: string): number[] {
  const digits = data.slice(0, 12).split('').map(Number)
  while (digits.length < 12) digits.push(0)
  digits.push(calculateEan13CheckDigit(digits))

  const bars: number[] = []
  bars.push(1, 0, 1) // start guard

  const parity = EAN_PARITY[digits[0]]
  for (let i = 1; i <= 6; i++) {
    const pattern = parity[i - 1] === 0
      ? EAN_L_PATTERNS[digits[i]]
      : EAN_G_PATTERNS[digits[i]]
    bars.push(...pattern)
  }

  bars.push(0, 1, 0, 1, 0) // center guard

  for (let i = 7; i <= 12; i++) {
    bars.push(...EAN_R_PATTERNS[digits[i]])
  }

  bars.push(1, 0, 1) // end guard
  return bars
}

/* ─── QR placeholder (simple dot matrix) ──────────────────── */

function generateQrMatrix(data: string, size: number): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  )

  // Deterministic hash-based fill for visual representation
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0
  }

  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4
        if (row + r < size && col + c < size) {
          matrix[row + r][col + c] = isOuter || isInner
        }
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  // Fill data area with hash-based pattern
  let seed = Math.abs(hash)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) continue
      if (r < 9 && c < 9) continue
      if (r < 9 && c >= size - 8) continue
      if (r >= size - 8 && c < 9) continue
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      matrix[r][c] = seed % 3 === 0
    }
  }

  return matrix
}

/* ─── Component ───────────────────────────────────────────── */

export function BarcodeGenerator({
  value,
  format = 'CODE128',
  width = 280,
  height = 100,
  showValue = true,
}: BarcodeGeneratorProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  /* ── Render barcode as SVG elements ── */
  const barcodeSvg = useMemo(() => {
    if (!value) return null

    if (format === 'QR') {
      const qrSize = 25
      const cellSize = Math.floor(width / qrSize)
      const totalSize = cellSize * qrSize
      const matrix = generateQrMatrix(value, qrSize)

      return (
        <svg
          ref={svgRef}
          width={totalSize}
          height={totalSize}
          viewBox={`0 0 ${totalSize} ${totalSize}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width={totalSize} height={totalSize} fill="white" />
          {matrix.map((row, r) =>
            row.map((cell, c) =>
              cell ? (
                <rect
                  key={`${r}-${c}`}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="black"
                />
              ) : null
            )
          )}
        </svg>
      )
    }

    if (format === 'EAN13') {
      const paddedValue = value.replace(/\D/g, '').padEnd(12, '0').slice(0, 12)
      const bars = encodeEan13(paddedValue)
      const moduleWidth = width / (bars.length + 10)

      const digits = paddedValue.split('').map(Number)
      digits.push(calculateEan13CheckDigit(digits))
      const displayValue = digits.join('')

      return (
        <svg
          ref={svgRef}
          width={width}
          height={height + (showValue ? 20 : 0)}
          viewBox={`0 0 ${width} ${height + (showValue ? 20 : 0)}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width={width} height={height + (showValue ? 20 : 0)} fill="white" />
          {bars.map((bar, i) =>
            bar === 1 ? (
              <rect
                key={i}
                x={5 + i * moduleWidth}
                y={0}
                width={moduleWidth}
                height={height}
                fill="black"
              />
            ) : null
          )}
          {showValue && (
            <text
              x={width / 2}
              y={height + 15}
              textAnchor="middle"
              fontSize="12"
              fontFamily="monospace"
              fill="black"
            >
              {displayValue}
            </text>
          )}
        </svg>
      )
    }

    // CODE128
    const patterns = encodeCode128B(value)
    const modules: { x: number; w: number }[] = []
    let xPos = 10

    for (const pattern of patterns) {
      if (!pattern || !Array.isArray(pattern)) continue
      let isBar = true
      for (const width of pattern) {
        if (isBar) {
          modules.push({ x: xPos, w: width })
        }
        xPos += width
        isBar = !isBar
      }
    }

    const totalWidth = xPos + 10
    const scaleX = width / totalWidth

    return (
      <svg
        ref={svgRef}
        width={width}
        height={height + (showValue ? 20 : 0)}
        viewBox={`0 0 ${width} ${height + (showValue ? 20 : 0)}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={width} height={height + (showValue ? 20 : 0)} fill="white" />
        {modules.map((mod, i) => (
          <rect
            key={i}
            x={mod.x * scaleX}
            y={0}
            width={mod.w * scaleX}
            height={height}
            fill="black"
          />
        ))}
        {showValue && (
          <text
            x={width / 2}
            y={height + 15}
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
            fill="black"
          >
            {value}
          </text>
        )}
      </svg>
    )
  }, [value, format, width, height, showValue])

  /* ── Download as PNG ── */
  const handleDownload = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = svg.viewBox.baseVal.width * 2
      canvas.height = svg.viewBox.baseVal.height * 2
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const link = document.createElement('a')
      link.download = `barcode-${value}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [value])

  /* ── Copy SVG to clipboard ── */
  const handleCopy = useCallback(async () => {
    const svg = svgRef.current
    if (!svg) return

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    await navigator.clipboard.writeText(svgString)
  }, [])

  if (!value) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg',
          'border border-(--color-border) bg-(--color-surface) p-6',
          'text-(--color-text-muted) text-sm'
        )}
      >
        Enter a value to generate a barcode
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Barcode display */}
      <div
        className={cn(
          'rounded-lg border border-(--color-border)',
          'bg-white p-4 shadow-(--shadow-sm)'
        )}
      >
        {barcodeSvg}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium',
            'bg-(--brand-primary) text-white',
            'hover:bg-(--brand-amber) transition-colors cursor-pointer'
          )}
        >
          <DownloadIcon />
          Download PNG
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium',
            'border border-(--color-border) bg-(--color-surface) text-(--color-text)',
            'hover:bg-(--color-elevated) transition-colors cursor-pointer'
          )}
        >
          <CopyIcon />
          Copy SVG
        </button>
      </div>
    </div>
  )
}

/* ─── Inline icons ────────────────────────────────────────── */

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
