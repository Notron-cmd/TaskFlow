'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, Kanban } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Email atau password salah')
      setLoading(false)
      return
    }

    router.push('/board')
    router.refresh()
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div
        className={`bg-[#16162A] border border-white/[0.06] rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="flex items-center gap-2 mb-8">
          <Kanban className="size-5 text-indigo-400" />
          <span className="font-display text-xl font-bold text-white">TaskFlow</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-white mb-1">
          Welcome back
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          Sign in to your workspace
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 text-rose-400 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin}>
          <div className="relative mb-3">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-600 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-[#1E1E35] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
              required
            />
          </div>

          <div className="relative mb-2">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-600 pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#1E1E35] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
              required
            />
          </div>

          <div className="text-right mb-6">
            <span className="text-xs text-indigo-400 hover:underline cursor-pointer">
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-display font-medium text-sm rounded-lg py-2.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-slate-600 text-xs">or continue with</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-white text-sm rounded-lg py-2.5 flex items-center justify-center gap-3 transition-all duration-150 mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-slate-500 text-sm">
          {"Don't have an account? "}
          <span
            onClick={() => router.push('/register')}
            className="text-indigo-400 cursor-pointer hover:underline"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  )
}
