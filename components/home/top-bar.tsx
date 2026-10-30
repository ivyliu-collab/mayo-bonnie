'use client'

import Link from 'next/link'
import { Home, Boxes, Plus, Settings, PawPrint } from 'lucide-react'

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 hidden border-b border-border/70 bg-background/80 backdrop-blur-md md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <PawPrint className="size-4.5" strokeWidth={2} />
          </span>
          <span className="text-base font-medium text-foreground">Pet Home</span>
        </div>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground"
          >
            <Home className="size-4" strokeWidth={1.75} />
            Home
          </Link>
          <Link
            href="/inventory"
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60"
          >
            <Boxes className="size-4" strokeWidth={1.75} />
            Inventory
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/stock-in"
            className="flex items-center gap-2 rounded-full bg-apricot/25 px-3.5 py-1.5 text-sm font-medium text-apricot-foreground transition-colors hover:bg-apricot/35 active:scale-95"
          >
            <Plus className="size-4" strokeWidth={2} />
            入库
          </Link>
          <Link
            href="/settings"
            aria-label="设置"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
          >
            <Settings className="size-4.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </header>
  )
}
