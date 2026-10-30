import Link from 'next/link'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { thisMonth as mockThisMonth } from '@/lib/mock-data'
import type { MonthAction } from '@/lib/data/household-data'

export function ThisMonthCard({ actions = mockThisMonth }: { actions?: MonthAction[] }) {
  return (
    <section className="rounded-[22px] bg-card p-5 shadow-[0_12px_30px_-22px_rgba(80,60,40,0.45)]">
      <header className="mb-4 flex items-baseline justify-between">
        <h2 className="text-base font-medium text-foreground">本月动作</h2>
        <span className="text-xs text-muted-foreground">This Month</span>
      </header>

      <div className="flex flex-col gap-2.5">
        {actions.map((item) => (
          <div
            key={item.section}
            className="flex items-center justify-between rounded-[18px] bg-background/55 px-4 py-3.5"
          >
            <span className="text-sm font-medium text-foreground">
              {item.section}
            </span>
            <div className="flex items-center gap-4">
              <Link
                href={`/history?tab=入库&section=${encodeURIComponent(item.section)}`}
                className="flex items-center gap-1.5 text-left transition-opacity hover:opacity-70"
              >
                <ArrowDownToLine className="size-4 text-sage-foreground" strokeWidth={1.75} />
                <span className="font-mono text-2xl font-semibold leading-none tabular-nums text-foreground">
                  {item.stockIn}
                </span>
                <span className="text-xs text-muted-foreground">入库</span>
              </Link>
              <span className="h-4 w-px bg-border" />
              <Link
                href={`/history?tab=消耗&section=${encodeURIComponent(item.section)}`}
                className="flex items-center gap-1.5 text-left transition-opacity hover:opacity-70"
              >
                <ArrowUpFromLine className="size-4 text-slate-blue-foreground" strokeWidth={1.75} />
                <span className="font-mono text-2xl font-semibold leading-none tabular-nums text-foreground">
                  {item.consume}
                </span>
                <span className="text-xs text-muted-foreground">消耗</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted-foreground">
        统计本月入库与消耗次数，点击查看 History
      </p>
    </section>
  )
}
