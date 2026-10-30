import { TopBar } from '@/components/home/top-bar'
import { Hero } from '@/components/home/hero'
import { StockLevelCard } from '@/components/home/stock-level-card'
import { ThisMonthCard } from '@/components/home/this-month-card'
import { ExpiryCard } from '@/components/home/expiry-card'
import { MyPets } from '@/components/home/my-pets'
import { BottomNav } from '@/components/home/bottom-nav'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentHouseholdId } from '@/lib/data/household-data'
import { getExpirySummary, getHouseholdPets, getInventoryProducts, getThisMonthActions, groupInventoryBySection } from '@/lib/data/household-data'
import { redirect } from 'next/navigation'

export async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  if (!(await getCurrentHouseholdId())) redirect('/onboarding')
  const [householdPets, inventoryProducts, monthActions, expirySummary] = await Promise.all([
    getHouseholdPets(),
    getInventoryProducts(),
    getThisMonthActions(),
    getExpirySummary(),
  ])
  const stockSections = groupInventoryBySection(inventoryProducts)

  return (
    <div className="min-h-dvh bg-background">
      <TopBar />

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">
        <Hero />

        {/* Inventory Dashboard — primary content */}
        <div className="mt-6 md:mt-8">
          <div className="mb-3 flex items-baseline gap-2 px-1">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Inventory
            </h2>
            <span className="text-xs text-muted-foreground">库存概览</span>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="md:col-span-2">
              <StockLevelCard sections={stockSections} />
            </div>
            <div className="flex flex-col gap-5">
              <ThisMonthCard actions={monthActions} />
              <ExpiryCard summary={expirySummary} />
            </div>
          </div>
        </div>

        {/* My Pets */}
        <div className="mt-7 md:mt-8">
          <MyPets pets={householdPets} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default HomePage
