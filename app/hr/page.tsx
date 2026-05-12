'use client'

import Image from 'next/image'

import {
  ShieldCheck,
  Clock3,
  CheckCircle2,
  LogOut,
  Eye,
  XCircle,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import { useRouter }
from 'next/navigation'

import toast
from 'react-hot-toast'

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

export default function HRDashboard() {

  const router = useRouter()

  const [user, setUser] =
    useState<any>(null)

  const [loading,
    setLoading] =
    useState(true)

  const [reimbursements,
    setReimbursements] =
    useState<any[]>([])

  const [totalData,
    setTotalData] =
    useState(0)

  const [pendingHR,
    setPendingHR] =
    useState(0)

  const [approvedHR,
    setApprovedHR] =
    useState(0)

  async function fetchData() {

    const {
      data,
      error
    } = await supabase
      .from('reimbursements')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
      )

    if (error) {

      console.error(error)

      toast.error(
        'Gagal mengambil data'
      )

      setLoading(false)

      return
    }

    setReimbursements(data)

    setTotalData(data.length)

    const pending =
      data.filter(
        (item) =>
          item.status === 'pending_hr'
      )

    setPendingHR(
      pending.length
    )

    const approved =
      data.filter(
        (item) =>
          item.status === 'pending_finance' ||
          item.status === 'approved'
      )

    setApprovedHR(
      approved.length
    )

    setLoading(false)
  }

  async function handleApprove(
    id: number
  ) {

    const { error } =
      await supabase
        .from('reimbursements')
        .update({

          status:
            'pending_finance',

          approved_by_hr:
            user.nama,

        })
        .eq('id', id)

    if (error) {

      console.error(error)

      toast.error(
        'Gagal approve reimbursement'
      )

      return
    }

    toast.success(
      'Reimbursement approved'
    )

    fetchData()
  }

  async function handleReject(
    id: number
  ) {

    const { error } =
      await supabase
        .from('reimbursements')
        .update({

          status:
            'rejected',

          approved_by_hr:
            user.nama,

        })
        .eq('id', id)

    if (error) {

      console.error(error)

      toast.error(
        'Gagal reject reimbursement'
      )

      return
    }

    toast.success(
      'Reimbursement rejected'
    )

    fetchData()
  }

  useEffect(() => {

    const currentUser =
      getUser()

    if (!currentUser) {

      router.push('/login')

      return
    }

    if (
      currentUser.role !== 'hr'
    ) {

      router.push('/login')

      return
    }

    setUser(currentUser)

    fetchData()

  }, [router])

  if (!user || loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-slate-100">

        <div className="text-slate-500 text-xl">
          Loading HR Dashboard...
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
              HR Dashboard
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

        {/* TITLE */}
        <div className="mb-8">

          <h2 className="text-4xl font-bold text-slate-900">
            HR Reimbursement Review
          </h2>

          <p className="text-slate-500 mt-2 text-lg">
            Review and approve employee reimbursements
          </p>

        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* TOTAL */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">

              <ShieldCheck
                className="text-blue-600"
                size={30}
              />

            </div>

            <p className="text-slate-500 text-lg">
              Total Reimbursements
            </p>

            <h3 className="text-5xl font-bold text-slate-900 mt-3">
              {totalData}
            </h3>

          </div>

          {/* PENDING */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">

              <Clock3
                className="text-amber-600"
                size={30}
              />

            </div>

            <p className="text-slate-500 text-lg">
              Pending HR
            </p>

            <h3 className="text-5xl font-bold text-slate-900 mt-3">
              {pendingHR}
            </h3>

          </div>

          {/* APPROVED */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">

              <CheckCircle2
                className="text-emerald-600"
                size={30}
              />

            </div>

            <p className="text-slate-500 text-lg">
              Approved HR
            </p>

            <h3 className="text-5xl font-bold text-slate-900 mt-3">
              {approvedHR}
            </h3>

          </div>

        </div>

        {/* TABLE */}
        <div className="mt-10 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

          {/* HEADER */}
          <div className="px-8 py-6 border-b border-slate-200">

            <h2 className="text-2xl font-bold text-slate-900">
              Reimbursement Requests
            </h2>

          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>

                  <th className="text-left px-8 py-5 text-slate-500 font-semibold">
                    Employee
                  </th>

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

                  <th className="text-left px-8 py-5 text-slate-500 font-semibold">
                    File
                  </th>

                  <th className="text-left px-8 py-5 text-slate-500 font-semibold">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {
                  reimbursements.map(
                    (item) => (

                      <tr
                        key={item.id}
                        className="border-t border-slate-100"
                      >

                        <td className="px-8 py-6 text-slate-800 font-medium">

                          {item.nama}

                        </td>

                        <td className="px-8 py-6 text-slate-700">

                          {item.jenis_claim}

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

                            {item.status}

                          </span>

                        </td>

                        <td className="px-8 py-6">

                          <a
                            href={
                              item.bukti_kuitansi
                            }
                            target="_blank"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                          >

                            <Eye size={18} />

                            View File

                          </a>

                        </td>

                        <td className="px-8 py-6">

                          {
                            item.status === 'pending_hr'
                              ? (

                                <div className="flex items-center gap-3">

                                  <button
                                    onClick={() =>
                                      handleApprove(
                                        item.id
                                      )
                                    }
                                    className="px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 transition-all text-emerald-700 font-medium"
                                  >

                                    Approve

                                  </button>

                                  <button
                                    onClick={() =>
                                      handleReject(
                                        item.id
                                      )
                                    }
                                    className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 transition-all text-red-700 font-medium"
                                  >

                                    Reject

                                  </button>

                                </div>

                              )
                              : (

                                <div className="flex items-center gap-2 text-slate-400">

                                  <XCircle size={18} />

                                  Completed

                                </div>

                              )
                          }

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