import {
  ChevronRight,
  Boxes,
  Bone,
  CupSoda,
  Cookie,
  Package,
} from 'lucide-react'
import { stockSections, type StockCategory } from '@/lib/mock-data'

const categoryIcons = {
  猫粮: Bone,
  狗粮: Bone,
  罐头: CupSoda,
  零食: Cookie,
  '餐包餐盒': Package,
  其他: Package,
}

function CategoryRow({ category, accent }: { category: StockCategory; accent: 'lavender' | 'slate-blue' }) {
  const Icon = categoryIcons[category.name as keyof typeof categoryIcons] ?? Package

  return (
    <button
      type="button"
      className={`group flex w-full items-center justify-between gap-3 rounded-[18px] bg-background/55 px-3 py-2.5 text-left transition-colors ${accent === 'lavender' ? 'hover:bg-lavender/10' : 'hover:bg-slate-blue/10'}`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${accent === 'lavender' ? 'bg-lavender/18 text-lavender-foreground' : 'bg-slate-blue/18 text-slate-blue-foreground'}`}>
          <Icon className="size-4" strokeWidth={1.7} />
        </span>
        <span className="truncate text-sm font-medium text-foreground">
          {category.name}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-xl font-semibold tabular-nums leading-none text-foreground">
          {category.quantity}
        </span>
        <span className="text-xs text-muted-foreground">{category.unit}</span>
        {category.opened ? (
          <span className="ml-1 rounded-full bg-apricot/20 px-2 py-0.5 text-[11px] font-medium text-apricot-foreground">
            {category.opened} 已开
          </span>
        ) : null}
        <ChevronRight className="size-4 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

export function StockLevelCard({ sections = stockSections }: { sections?: typeof stockSections }) {
  return (
    <section className="rounded-[24px] bg-card p-5 shadow-[0_16px_34px_-24px_rgba(80,60,40,0.38)] sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Boxes className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-base font-medium leading-none text-foreground">
              库存水位
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Stock Level · 按分区分类
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {sections.map((section) => (
          <div key={section.key}>
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className={`size-2 rounded-full ${section.key === 'cat' ? 'bg-lavender' : 'bg-slate-blue'}`} />
              <span className="text-sm font-medium text-foreground">
                {section.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {section.categories.length} 类
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {section.categories.map((category) => (
                <CategoryRow key={category.name} category={category} accent={section.key === 'cat' ? 'lavender' : 'slate-blue'} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
