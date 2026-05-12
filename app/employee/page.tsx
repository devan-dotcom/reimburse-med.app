'use client'

import Image from 'next/image'

import {
  LayoutDashboard,
  Wallet,
  Receipt,
  LogOut,
  CircleDollarSign,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import { useRouter }
from 'next/navigation'

import {
  format
} from 'date-fns'

import {
  supabase
} from '@/lib/supabase'

import {
  getUser,
  logout
} from '@/lib/auth'

import {
  formatRupiah
} from '@/lib/format'

import {
  getStatusColor
} from '@/lib/status'

export default function EmployeeDashboard() {

  const router = useRouter()

  const [user, setUser] =
    useState<any>(null)

  const [reimbursements,
    setReimbursements] =
    useState<any[]>([])

  const [loading,
    setLoading] =
    useState(true)

  const [totalClaims,
    setTotalClaims] =
    useState(0)

  const [pendingClaims,
    setPendingClaims] =
    useState(0)

  const [approvedClaims,
    setApprovedClaims] =
    useState(0)

  async function fetchData(
    currentUser: any
  ) {

    const {
      data,
      error
    } = await supabase
      .from('reimbursements')
      .select('*')
      .eq('nama', currentUser.nama)
      .order(
        'created_at',
        { ascending: false }
      )

    if (error) {

      console.error(error)

      setLoading(false)

      return
    }

    setReimbursements(data)

    setTotalClaims(data.length)

    const pending =
      data.filter(
        (item) =>
          item.status === 'pending_hr' ||
          item.status === 'pending_finance'
      )

    setPendingClaims(
      pending.length
    )

    const approved =
      data.filter(
        (item) =>
          item.status === 'approved'
      )

    setApprovedClaims(
      approved.length
    )

    setLoading(false)
  }

  useEffect(() => {

    const currentUser =
      getUser()

    if (!currentUser) {

      router.push('/login')

      return
    }

    if (
      currentUser.role !== 'employee'
    ) {

      router.push('/login')

      return
    }

    setUser(currentUser)

    fetchData(currentUser)

  }, [router])

  if (!user || loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-slate-100">

        <div className="text-slate-500 text-xl">
          Loading dashboard...
        </div>

      </div>

    )
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">

        {/* LEFT */}
        <div className="flex items-center gap-5">

          {/* LOGO */}
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">

            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
            />

          </div>

          {/* TITLE */}
          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Employee Dashboard
            </h1>

            <p className="text-slate-500">
              Medical Reimbursement System
            </p>

          </div>

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          <div className="text-right">

            <h2 className="font-semibold text-slate-800">
              {user.nama}
            </h2>

            <p className="text-sm text-slate-500 capitalize">
              {user.role}
            </p>

          </div>

          <button
            onClick={logout}
            className="w-12 h-12 rounded-2xl bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center text-red-500"
          >

            <LogOut size={22} />

          </button>

        </div>

      </header>

      {/* CONTENT */}
      <main className="p-8">

        {/* WELCOME */}
        <div className="mb-8">

          <h2 className="text-4xl font-bold text-slate-900">
            Welcome back, {user.nama}
          </h2>

          <p className="text-slate-500 mt-2 text-lg">
            Manage your reimbursement activity here
          </p>

        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* TOTAL CLAIM */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">

              <LayoutDashboard
                className="text-blue-600"
                size={30}
              />

            </div>

            <p className="text-slate-500 text-lg">
              Total Claims
            </p>

            <h3 className="text-5xl font-bold text-slate-900 mt-3">
              {totalClaims}
            </h3>

          </div>

          {/* APPROVED */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">

              <Wallet
                className="text-emerald-600"
                size={30}
              />

            </div>

            <p className="text-slate-500 text-lg">
              Approved Claims
            </p>

            <h3 className="text-5xl font-bold text-slate-900 mt-3">
              {approvedClaims}
            </h3>

          </div>

          {/* PENDING */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center mb-6">

              <Receipt
                className="text-cyan-600"
                size={30}
              />

            </div>

            <p className="text-slate-500 text-lg">
              Pending Claims
            </p>

            <h3 className="text-5xl font-bold text-slate-900 mt-3">
              {pendingClaims}
            </h3>

          </div>

        </div>

        {/* BUTTON */}
        <div className="mt-8">

          <button
            onClick={() =>
              router.push(
                '/employee/submit'
              )
            }
            className="flex items-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-all text-white font-semibold text-lg shadow-lg"
          >

            <CircleDollarSign
              size={24}
            />

            Submit Reimbursement

          </button>

        </div>

        {/* TABLE */}
        <div className="mt-10 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

          {/* HEADER */}
          <div className="px-8 py-6 border-b border-slate-200">

            <h2 className="text-2xl font-bold text-slate-900">
              Recent Reimbursements
            </h2>

          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>

                  <th className="text-left px-8 py-5 text-slate-500 font-semibold">
                    Claim
                  </th>

                  <th className="text-left px-8 py-5 text-slate-500 font-semibold">
                    Date
                  </th>

                  <th className="text-left px-8 py-5 text-slate-500 font-semibold">
                    Amount
                  </th>

                  <th className="text-left px-8 py-5 text-slate-500 font-semibold">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {
                  reimbursements.length === 0 && (

                    <tr>

                      <td
                        colSpan={4}
                        className="px-8 py-10 text-center text-slate-500"
                      >

                        Belum ada reimbursement

                      </td>

                    </tr>

                  )
                }

                {
                  reimbursements.map(
                    (item) => (

                      <tr
                        key={item.id}
                        className="border-t border-slate-100"
                      >

                        <td className="px-8 py-6 text-slate-800 font-medium">

                          {
                            item.jenis_claim
                          }

                        </td>

                        <td className="px-8 py-6 text-slate-500">

                          {
                            item.tanggal_pengobatan
                              ? format(
                                  new Date(
                                    item.tanggal_pengobatan
                                  ),
                                  'dd MMM yyyy'
                                )
                              : '-'
                          }

                        </td>

                        <td className="px-8 py-6 font-semibold text-slate-900">

                          {
                            formatRupiah(
                              item.nominal
                            )
                          }

                        </td>

                        <td className="px-8 py-6">

                          <span
                            className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}
                          >

                            {
                              item.status
                            }

                          </span>

                        </td>

                      </tr>

                    )
                  )
                }

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </div>
  )
}