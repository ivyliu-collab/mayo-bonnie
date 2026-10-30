'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'

type BarcodeScannerProps = {
  onDetected: (value: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let frame = 0
    async function start() {
      const Detector = (window as Window & { BarcodeDetector?: new (options?: { formats: string[] }) => { detect(video: HTMLVideoElement): Promise<Array<{ rawValue: string }>> } }).BarcodeDetector
      if (!Detector) {
        setError('当前浏览器不支持原生条码扫描，请在下方输入条码')
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('当前设备无法访问摄像头，请在下方输入条码')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        if (!active || !videoRef.current) { stream.getTracks().forEach((track) => track.stop()); return }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'] })
        const detect = async () => {
          if (!active || !videoRef.current) return
          try {
            const results = await detector.detect(videoRef.current)
            const value = results[0]?.rawValue?.trim()
            if (value) { onDetected(value); return }
          } catch { /* Keep the camera alive and let manual entry handle unsupported frames. */ }
          frame = requestAnimationFrame(detect)
        }
        frame = requestAnimationFrame(detect)
      } catch (cause) {
        setError(cause instanceof DOMException && cause.name === 'NotAllowedError' ? '摄像头权限被拒绝，请在浏览器设置中允许后重试' : '无法打开摄像头，请改用手动输入')
      }
    }
    void start()
    return () => { active = false; cancelAnimationFrame(frame); streamRef.current?.getTracks().forEach((track) => track.stop()) }
  }, [onDetected])

  return <div className="mt-4 overflow-hidden rounded-[24px] bg-foreground p-3 text-background"><div className="flex items-center justify-between px-2 py-1"><span className="flex items-center gap-2 text-sm"><Camera className="size-4" />将条码放入取景框</span><button type="button" onClick={onClose} aria-label="关闭扫描"><X className="size-5" /></button></div><div className="relative mt-3 aspect-video overflow-hidden rounded-2xl bg-black"><video ref={videoRef} muted playsInline className="size-full object-cover" /><span className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-primary" /></div>{error && <p className="mt-3 rounded-xl bg-card/15 px-3 py-2 text-xs text-background/85">{error}</p>}</div>
}
