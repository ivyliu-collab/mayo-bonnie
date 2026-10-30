import { expiry as mockExpiry, type ExpiryStatus } from '@/lib/mock-data'
import type { ExpirySummary } from '@/lib/data/household-data'

const styles: Record<
  ExpiryStatus['key'],
  { dot: string; bg: string; text: string; ring: string }
> = {
  expired: {
    dot: 'bg-expired',
    bg: 'bg-expired-soft',
    text: 'text-expired',
    ring: 'ring-expired/20',
  },
  urgent: {
    dot: 'bg-urgent',
    bg: 'bg-urgent-soft',
    text: 'text-urgent',
    ring: 'ring-urgent/20',
  },
  attention: {
    dot: 'bg-attention',
    bg: 'bg-attention-soft',
    text: 'text-attention',
    ring: 'ring-attention/20',
  },
  safe: {
    dot: 'bg-safe',
    bg: 'bg-safe-soft',
    text: 'text-safe',
    ring: 'ring-safe/20',
  },
}

export function ExpiryCard({ summary = mockExpiry }: { summary?: ExpirySummary[] }) {
  const attentionCount = summary
    .filter((item) => item.key !== 'safe')
    .reduce((total, item) => total + item.count, 0)
  return (
    <section className="rounded-[22px] bg-card p-5 shadow-[0_12px_30px_-22px_rgba(80,60,40,0.45)]">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-base font-medium text-foreground">效期汇总</h2>
          <p className="mt-2 flex items-baseline gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono text-2xl font-semibold leading-none text-expired">{attentionCount}</span>
            <span>items need attention</span>
          </p>
        </div>
        <span className="text-xs text-muted-foreground">Expiry</span>
      </header>

      <div className="grid grid-cols-2 gap-2.5">
        {summary.map((item) => {
          const s = styles[item.key]
          const emphasize = item.key !== 'safe'
          return (
            <button
              key={item.key}
              type="button"
              className={`flex flex-col gap-1.5 rounded-[18px] px-4 py-3.5 text-left transition-transform hover:-translate-y-0.5 ${
                emphasize ? `${s.bg} ring-1 ${s.ring}` : 'bg-background/35 opacity-60'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${s.dot}`} />
                <span className={`text-xs font-medium ${item.key === 'safe' ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {item.label}
                </span>
              </span>
              <span className="flex items-baseline gap-1">
                <span
                  className={`font-mono text-2xl font-medium tabular-nums leading-none ${
                    emphasize ? s.text : 'text-foreground'
                  }`}
                >
                  {item.count}
                </span>
                <span className="text-xs text-muted-foreground">件</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                涉及 {item.products} 种商品
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
