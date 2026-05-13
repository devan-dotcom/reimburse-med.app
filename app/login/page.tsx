'use client'

import Image from 'next/image'

import {
  HeartPulse,
  ShieldCheck,
  BarChart3,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

import {
  supabase,
} from '@/lib/supabase'

export default function LoginPage() {

  const router = useRouter()

  const [email,
    setEmail] =
    useState('')

  const [password,
    setPassword] =
    useState('')

  const [showPassword,
    setShowPassword] =
    useState(false)

  const [loading,
    setLoading] =
    useState(false)

  const [errorMessage,
    setErrorMessage] =
    useState('')

  async function handleLogin(
    e: React.FormEvent
  ) {

    e.preventDefault()

    setLoading(true)

    setErrorMessage('')

    /* =========================
       CHECK USER
    ========================= */

    const {
      data,
      error,
    } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (
      error ||
      !data
    ) {

      setErrorMessage(
        'Email atau password salah'
      )

      setLoading(false)

      return
    }

    /* =========================
       SAVE SESSION
    ========================= */

    localStorage.setItem(
      'user',
      JSON.stringify(data)
    )

    /* =========================
       REDIRECT ROLE
    ========================= */

    if (
      data.role ===
      'employee'
    ) {

      router.push(
        '/employee'
      )

    } else if (
      data.role ===
      'hr'
    ) {

      router.push(
        '/hr'
      )

    } else if (
      data.role ===
      'finance'
    ) {

      router.push(
        '/finance'
      )

    } else {

      setErrorMessage(
        'Role tidak dikenali'
      )

    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-[#F4F7FB] overflow-hidden">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-16 flex-col justify-between overflow-hidden">

        {/* BG */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-40 blur-3xl" />

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-100 rounded-full opacity-40 blur-3xl" />

        {/* MEDICAL LINE */}
        <div className="absolute top-40 right-10 opacity-10">

          <svg
            width="260"
            height="120"
            viewBox="0 0 260 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >

            <path
              d="M0 60H50L80 20L120 100L150 40L180 60H260"
              stroke="#2563EB"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

          </svg>

        </div>

        {/* CONTENT */}
        <div className="relative z-10">

          {/* LOGO */}
          <div className="w-44 h-44 bg-white rounded-[32px] shadow-xl border border-white/50 flex items-center justify-center mb-10 backdrop-blur-sm">

            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={120}
              priority
            />

          </div>

          {/* TITLE */}
          <h1 className="text-[64px] leading-[72px] font-bold text-slate-900 tracking-tight max-w-xl">

            Medical
            <br />
            Reimbursement
            <br />
            System

          </h1>

          {/* DESC */}
          <p className="mt-8 text-slate-600 text-xl leading-relaxed max-w-xl">

            Internal healthcare reimbursement platform
            for employees, HR verification,
            and finance approval management.

          </p>

          {/* LINE */}
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mt-10" />

        </div>

        {/* FEATURES */}
        <div className="relative z-10 grid grid-cols-3 gap-6">

          {/* CARD */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-lg">

            <div className="w-14 h-14 rounded-2xl bg-cyan-100 flex items-center justify-center mb-5">

              <ShieldCheck
                className="text-cyan-600"
                size={28}
              />

            </div>

            <h3 className="text-slate-900 font-bold text-2xl mb-3">
              Secure
            </h3>

            <p className="text-slate-600 leading-relaxed">
              Your reimbursement data is protected.
            </p>

          </div>

          {/* CARD */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-lg">

            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-5">

              <HeartPulse
                className="text-emerald-600"
                size={28}
              />

            </div>

            <h3 className="text-slate-900 font-bold text-2xl mb-3">
              Healthcare
            </h3>

            <p className="text-slate-600 leading-relaxed">
              Built specifically for medical reimbursement.
            </p>

          </div>

          {/* CARD */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-lg">

            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-5">

              <BarChart3
                className="text-blue-600"
                size={28}
              />

            </div>

            <h3 className="text-slate-900 font-bold text-2xl mb-3">
              Efficient
            </h3>

            <p className="text-slate-600 leading-relaxed">
              Faster reimbursement workflow process.
            </p>

          </div>

        </div>

      </div>

      {/* RIGHT */}
      <div className="flex flex-1 items-center justify-center p-8 relative">

        <div className="absolute top-10 right-10 w-32 h-32 bg-slate-200 rounded-full opacity-30 blur-2xl" />

        {/* CARD */}
        <div className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl border border-slate-100 p-12 relative z-10">

          {/* LOGO */}
          <div className="flex flex-col items-center">

            <div className="w-40 h-40 rounded-[32px] bg-white border border-slate-200 shadow-md flex items-center justify-center mb-8">

              <Image
                src="/logo.png"
                alt="Logo"
                width={110}
                height={110}
                priority
              />

            </div>

            <h2 className="text-5xl font-bold text-slate-900 tracking-tight">
              Welcome Back
            </h2>

            <p className="text-slate-500 text-center text-lg mt-5 leading-relaxed max-w-md">

              Sign in to continue accessing your
              medical reimbursement portal

            </p>

          </div>

          {/* FORM */}
          <form
            onSubmit={handleLogin}
            className="mt-12 space-y-8"
          >

            {/* EMAIL */}
            <div>

              <label className="text-slate-800 font-semibold text-lg">
                Email
              </label>

              <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 px-5 py-4 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">

                <Mail
                  className="text-slate-400"
                  size={22}
                />

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  className="w-full outline-none text-slate-700 placeholder:text-slate-400 bg-transparent"
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div>

              <label className="text-slate-800 font-semibold text-lg">
                Password
              </label>

              <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 px-5 py-4 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">

                <Lock
                  className="text-slate-400"
                  size={22}
                />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  className="w-full outline-none text-slate-700 placeholder:text-slate-400 bg-transparent"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >

                  {
                    showPassword
                      ? (
                        <EyeOff
                          className="text-slate-400"
                          size={22}
                        />
                      )
                      : (
                        <Eye
                          className="text-slate-400"
                          size={22}
                        />
                      )
                  }

                </button>

              </div>

            </div>

            {/* ERROR */}
            {
              errorMessage && (

                <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-2xl">

                  {errorMessage}

                </div>

              )
            }

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all text-white font-bold text-xl shadow-xl disabled:opacity-50"
            >

              {
                loading
                  ? 'Signing In...'
                  : 'Sign In'
              }

            </button>

          </form>

        </div>

      </div>

    </div>
  )
}