'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    setLoading(false)
    setMessage(error ? error.message : '登录链接已发送，请检查邮箱。')
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-[28px] bg-card p-7 shadow-[0_18px_38px_-26px_rgba(80,60,40,0.42)] ring-1 ring-border/60">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Pet Home</p>
        <h1 className="mt-3 text-2xl font-medium text-foreground">登录你的宠物家庭</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">输入邮箱，我们会发送一次性登录链接。</p>
        <form onSubmit={sendMagicLink} className="mt-7 space-y-4">
          <label className="block text-sm text-foreground">
            邮箱
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl bg-background px-4 py-3 outline-none ring-1 ring-border/70 focus:ring-primary"
              placeholder="you@example.com"
            />
          </label>
          <button disabled={loading} className="w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {loading ? '发送中…' : '发送登录链接'}
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-muted-foreground" role="status">{message}</p> : null}
      </section>
    </main>
  )
}
