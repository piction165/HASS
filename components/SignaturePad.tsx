'use client'

import { useCallback, useLayoutEffect, useRef } from 'react'

type Props = {
  className?: string
  onChange: (dataUrl: string) => void
  clearLabel: string
}

export function SignaturePad({ className, onChange, clearLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  const getCtx = useCallback(() => {
    const c = canvasRef.current
    if (!c) return null
    const ctx = c.getContext('2d')
    if (!ctx) return null
    return { c, ctx }
  }, [])

  useLayoutEffect(() => {
    const pack = getCtx()
    if (!pack) return
    const { c, ctx } = pack
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const w = c.offsetWidth || 300
    const h = c.offsetHeight || 160
    c.width = Math.floor(w * dpr)
    c.height = Math.floor(h * dpr)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [getCtx])

  function pos(e: React.MouseEvent | React.TouchEvent) {
    const c = canvasRef.current
    if (!c) return { x: 0, y: 0 }
    const r = c.getBoundingClientRect()
    if ('touches' in e && e.touches[0]) {
      return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
    }
    const me = e as React.MouseEvent
    return { x: me.clientX - r.left, y: me.clientY - r.top }
  }

  function emit() {
    const c = canvasRef.current
    if (!c) return
    onChange(c.toDataURL('image/png'))
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = true
    last.current = pos(e)
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return
    e.preventDefault()
    const pack = getCtx()
    if (!pack || !last.current) return
    const { ctx } = pack
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    emit()
  }

  function end() {
    drawing.current = false
    last.current = null
    emit()
  }

  function clear() {
    const pack = getCtx()
    if (!pack) return
    const { c, ctx } = pack
    const w = c.width / (window.devicePixelRatio || 1)
    const h = c.height / (window.devicePixelRatio || 1)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
    const dpr = window.devicePixelRatio || 1
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    onChange('')
  }

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="signature-canvas"
        style={{ width: '100%', height: 160, touchAction: 'none', borderRadius: 12, border: '2px solid #e5e7eb', cursor: 'crosshair' }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button type="button" className="btn-ghost" style={{ marginTop: 8, fontWeight: 700, color: '#6b7280' }} onClick={clear}>
        {clearLabel}
      </button>
    </div>
  )
}
