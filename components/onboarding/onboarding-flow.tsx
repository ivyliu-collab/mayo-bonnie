'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, PawPrint, Plus, X } from 'lucide-react'
import type { IdentityColor } from '@/lib/mock-data'
import { identityColorOptions } from '@/lib/settings-data'
import { createHousehold } from '@/app/actions/household'

const identityDot: Record<IdentityColor, string> = {
  lavender: 'bg-lavender',
  sage: 'bg-sage',
  apricot: 'bg-apricot',
  'slate-blue': 'bg-slate-blue',
}

type DraftPet = {
  id: string
  name: string
  type: '猫' | '狗'
  breed: string
  sex: '公' | '母'
  birthday: string
  color: IdentityColor
  photo: string
}

const stockTemplate: Record<'猫' | '狗', string[]> = {
  猫: ['罐头', '餐包餐盒', '猫粮', '零食', '其他'],
  狗: ['狗粮', '罐头', '零食', '其他'],
}

const steps = ['创建家庭', '添加宠物', '初始化库存分类']

function makeDraftPet(color: IdentityColor): DraftPet {
  return { id: `pet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: '', type: '猫', breed: '', sex: '母', birthday: '', color, photo: '/pets/orange.png' }
}

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const [householdName, setHouseholdName] = useState('')
  const [householdId, setHouseholdId] = useState('PH-------')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setHouseholdId('PH-' + Math.random().toString(36).slice(2, 8).toUpperCase())
  }, [])

  const [pets, setPets] = useState<DraftPet[]>([makeDraftPet('apricot')])

  const sections = useMemo(() => {
    const types = Array.from(new Set(pets.map((pet) => pet.type)))
    return types.length ? types : (['猫'] as const)
  }, [pets])

  function updatePet(id: string, patch: Partial<DraftPet>) {
    setPets((current) => current.map((pet) => (pet.id === id ? { ...pet, ...patch } : pet)))
  }

  function addPet() {
    const nextColor = identityColorOptions[pets.length % identityColorOptions.length]
    setPets((current) => [...current, makeDraftPet(nextColor)])
  }

  function removePet(id: string) {
    setPets((current) => (current.length > 1 ? current.filter((pet) => pet.id !== id) : current))
  }

  const canContinueStep1 = householdName.trim().length > 0
  const canContinueStep2 = pets.every((pet) => pet.name.trim().length > 0)

  async function finishOnboarding() {
    setSaving(true)
    setError('')
    try {
      await createHousehold({
        name: householdName,
        pets: pets.map(({ name, type, breed, birthday, color, photo }) => ({ name, type, breed, birthday, color, photo })),
      })
      router.push('/')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-xl items-center gap-3 px-5 pt-6 md:px-0">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            aria-label="上一步"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-4.5" />
          </button>
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <PawPrint className="size-4.5" strokeWidth={2} />
          </span>
        )}
        <div className="flex flex-1 items-center gap-2">
          {steps.map((label, index) => (
            <div key={label} className="flex flex-1 flex-col gap-1.5">
              <div className={`h-1.5 rounded-full transition-colors ${index <= step ? 'bg-primary' : 'bg-secondary'}`} />
            </div>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 pb-16 pt-8 md:px-0">
        {step === 0 && (
          <StepHouseholdCreate
            name={householdName}
            onNameChange={setHouseholdName}
            householdId={householdId}
          />
        )}
        {step === 1 && (
          <StepAddPets pets={pets} onUpdate={updatePet} onAdd={addPet} onRemove={removePet} />
        )}
        {step === 2 && <StepInitStock sections={sections as ('猫' | '狗')[]} />}

        {error ? <p className="mt-6 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}</p> : null}

        <div className="mt-8">
          {step < 2 ? (
            <button
              type="button"
              disabled={step === 0 ? !canContinueStep1 : !canContinueStep2}
              onClick={() => setStep((value) => value + 1)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
            >
              继续
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={finishOnboarding}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-medium text-primary-foreground"
            >
              {saving ? '保存中…' : '进入我的宠物之家'}
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

function StepHouseholdCreate({
  name,
  onNameChange,
  householdId,
}: {
  name: string
  onNameChange: (value: string) => void
  householdId: string
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Step 1</p>
      <h1 className="mt-2 text-2xl font-medium text-balance text-foreground">创建你的家庭空间</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        家人可以使用同一个 ID 和密码进入这个家庭空间
      </p>

      <div className="mt-7 flex flex-col gap-4">
        <label className="text-sm text-muted-foreground">
          家庭名称
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="例如：毛孩之家"
            className="mt-1.5 w-full rounded-2xl bg-card p-4 text-sm text-foreground ring-1 ring-border/70 outline-none placeholder:text-muted-foreground/60"
          />
        </label>

        <div className="text-sm text-muted-foreground">
          家庭 ID
          <div className="mt-1.5 flex items-center justify-between rounded-2xl bg-secondary/70 p-4 font-mono text-sm text-foreground">
            {householdId}
            <span className="text-xs text-muted-foreground">自动生成</span>
          </div>
        </div>

      </div>
    </div>
  )
}

function StepAddPets({
  pets,
  onUpdate,
  onAdd,
  onRemove,
}: {
  pets: DraftPet[]
  onUpdate: (id: string, patch: Partial<DraftPet>) => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Step 2</p>
      <h1 className="mt-2 text-2xl font-medium text-balance text-foreground">介绍一下你的毛孩</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">名字和类型是必填的，其他资料可以之后慢慢补充</p>

      <div className="mt-7 flex flex-col gap-4">
        {pets.map((pet, index) => (
          <div key={pet.id} className="overflow-hidden rounded-[26px] bg-card ring-1 ring-border/60">
            <div className="relative">
              <img src={pet.photo} alt="宠物照片预览" className="h-40 w-full object-cover" />
              <span className={`absolute left-3 top-3 size-3 rounded-full ring-2 ring-card ${identityDot[pet.color]}`} />
              {pets.length > 1 ? (
                <button
                  type="button"
                  aria-label="移除这只宠物"
                  onClick={() => onRemove(pet.id)}
                  className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-foreground/40 text-card backdrop-blur-sm"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-muted-foreground">
                  名字
                  <input
                    value={pet.name}
                    onChange={(event) => onUpdate(pet.id, { name: event.target.value })}
                    placeholder={`第 ${index + 1} 只`}
                    className="mt-1 w-full rounded-xl bg-background p-3 text-sm text-foreground ring-1 ring-border/70 outline-none"
                  />
                </label>
                <label className="text-sm text-muted-foreground">
                  类型
                  <select
                    value={pet.type}
                    onChange={(event) => onUpdate(pet.id, { type: event.target.value as '猫' | '狗' })}
                    className="mt-1 w-full rounded-xl bg-background p-3 text-sm text-foreground ring-1 ring-border/70"
                  >
                    <option value="猫">猫</option>
                    <option value="狗">狗</option>
                  </select>
                </label>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-sm text-muted-foreground">
                  品种 <span className="text-muted-foreground/60">· 可选</span>
                  <input
                    value={pet.breed}
                    onChange={(event) => onUpdate(pet.id, { breed: event.target.value })}
                    className="mt-1 w-full rounded-xl bg-background p-3 text-sm text-foreground ring-1 ring-border/70 outline-none"
                  />
                </label>
                <label className="text-sm text-muted-foreground">
                  生日 <span className="text-muted-foreground/60">· 可选</span>
                  <input
                    value={pet.birthday}
                    onChange={(event) => onUpdate(pet.id, { birthday: event.target.value })}
                    type="date"
                    className="mt-1 w-full rounded-xl bg-background p-3 text-sm text-foreground ring-1 ring-border/70 outline-none"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">身份颜色 · 可选</span>
                <div className="flex gap-1.5">
                  {identityColorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`选择颜色 ${color}`}
                      onClick={() => onUpdate(pet.id, { color })}
                      className={`size-6 rounded-full ${identityDot[color]} ${pet.color === color ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center gap-1.5 rounded-[24px] border border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60"
        >
          <Plus className="size-4" />
          再添加一只
        </button>
      </div>
    </div>
  )
}

function StepInitStock({ sections }: { sections: ('猫' | '狗')[] }) {
  const [editing, setEditing] = useState(false)

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Step 3</p>
      <h1 className="mt-2 text-2xl font-medium text-balance text-foreground">为你的库存准备好分类</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        根据你添加的宠物，我们准备了一份可以直接使用的库存分类模板
      </p>

      <div className="mt-7 flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section} className="rounded-[24px] bg-card p-5 ring-1 ring-border/60">
            <div className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${section === '猫' ? 'bg-apricot' : 'bg-slate-blue'}`} />
              <h2 className="text-sm font-medium text-foreground">{section} 分区</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {stockTemplate[section].map((category) => (
                <span key={category} className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs text-muted-foreground ring-1 ring-border/60">
                  <Check className="size-3 text-safe" />
                  {category}
                </span>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          编辑分类
        </button>

        {editing ? (
          <div className="rounded-[20px] bg-secondary/60 p-4 text-center text-xs text-muted-foreground">
            分类编辑可以在设置中随时进行，现在可以先接受默认模板
          </div>
        ) : null}
      </div>
    </div>
  )
}
