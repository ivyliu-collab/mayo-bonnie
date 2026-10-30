'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings, PawPrint } from 'lucide-react'
import { household } from '@/lib/mock-data'

function getGreeting(hour: number) {
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 14) return '午安'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function Hero() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
  }, [])

  const greeting = now ? getGreeting(now.getHours()) : '你好'
  const dateLabel = now
    ? `${now.getMonth() + 1}月${now.getDate()}日 · ${weekdays[now.getDay()]}`
    : ''

  return (
    <section className="relative overflow-hidden rounded-[26px] shadow-[0_18px_40px_-24px_rgba(80,60,40,0.5)]">
      <img
        src="/pets/hero.png"
        alt="橘子和可乐在洒满晨光的沙发上休息"
        className="h-44 w-full object-cover object-center sm:h-52 md:h-60"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.24_0.02_60/0.72)] via-[oklch(0.24_0.02_60/0.35)] to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(1_0_0/0.16)] px-3 py-1 text-xs font-medium text-[oklch(0.98_0.008_88)] backdrop-blur-sm">
            <PawPrint className="size-3.5" strokeWidth={2} />
            {household.petCount} 只毛孩
          </span>
          <Link
            href="/settings"
            aria-label="设置"
            className="flex size-9 items-center justify-center rounded-full bg-[oklch(1_0_0/0.16)] text-[oklch(0.98_0.008_88)] backdrop-blur-sm transition-colors hover:bg-[oklch(1_0_0/0.28)]"
          >
            <Settings className="size-4.5" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="text-[oklch(0.98_0.008_88)]">
          <p className="text-xs font-light tracking-wide text-[oklch(0.98_0.008_88/0.85)]">
            {dateLabel}
          </p>
          <h1 className="mt-1 text-2xl font-medium leading-tight text-balance sm:text-[28px]">
            {greeting}，{household.name}
          </h1>
        </div>
      </div>
    </section>
  )
}
