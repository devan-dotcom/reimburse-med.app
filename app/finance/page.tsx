'use client'

import Image from 'next/image'

import {
  BadgeCheck,
  Clock3,
  Wallet,
  LogOut,
  Eye,
  Upload,
  Search,
  KeyRound,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
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
  v4 as uuidv4
} from 'uuid'

import {
  supabase
} from '@/lib/supabase'

import {
  getUser,
  logout,
  saveUser,
} from '@/lib/auth'

import {
  formatRupiah
} from '@/lib/format'

import {
  getStatusColor
} from '@/lib/status'

export default function FinanceDashboard() {

  const router = useRouter()

  const [user, setUser] =
    useState<any>(null)

  const [loading,
    setLoading] =
    useState(true)

  const [reimbursements,
    setReimbursements] =
    useState<any[]>([])

  const [paymentFiles,
    setPaymentFiles] =
    useState<Record<number, File | null>>({})

  const [totalData,
    setTotalData] =
    useState(0)

  const [pendingFinance,
    setPendingFinance] =
    useState(0)

  const [completedPayment,
    setCompletedPayment] =
    useState(0)

  /* =====================
     FILTER
  ===================== */

  const [search,
    setSearch] =
    useState('')

  const [statusFilter,
    setStatusFilter] =
    useState('all')

  const [monthFilter,
    setMonthFilter] =
    useState('all')

  /* =====================
     CHANGE PASSWORD
  ===================== */

  const [showPasswordModal,
    setShowPasswordModal] =
    useState(false)

  const [newPassword,
    setNewPassword] =
    useState('')

  const [confirmPassword,
    setConfirmPassword] =
    useState('')

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
          item.status ===
          'pending_finance'
      )

    setPendingFinance(
      pending.length
    )

    const approved =
      data.filter(
        (item) =>
          item.status ===
          'approved'
      )

    setCompletedPayment(
      approved.length
    )

    setLoading(false)
  }

  async function handleApprove(
    id: number
  ) {

    const file =
      paymentFiles[id]

    if (!file) {

      toast.error(
        'Upload bukti transfer terlebih dahulu'
      )

      return
    }

    try {

      const reimbursement =
        reimbursements.find(
          (item) =>
            item.id === id
        )

      if (!reimbursement) {

        toast.error(
          'Data reimbursement tidak ditemukan'
        )

        return
      }

      /* =====================
         FILE NAME
      ===================== */

      const fileExt =
        file.name
          .split('.')
          .pop()

      const fileName =
        `${uuidv4()}.${fileExt}`

      /* =====================
         UPLOAD FILE
      ===================== */

      const {
        error: uploadError
      } = await supabase
        .storage
        .from(
          'payment-proof'
        )
        .upload(
          fileName,
          file
        )

      if (uploadError) {

        console.error(
          uploadError
        )

        toast.error(
          'Gagal upload bukti transfer'
        )

        return
      }

      /* =====================
         GET PUBLIC URL
      ===================== */

      const {
        data: publicUrlData
      } = supabase
        .storage
        .from(
          'payment-proof'
        )
        .getPublicUrl(
          fileName
        )

      const fileUrl =
        publicUrlData
          .publicUrl

      /* =====================
         UPDATE REIMBURSEMENT
      ===================== */

      const {
        error:
          reimbursementError
      } = await supabase
        .from(
          'reimbursements'
        )
        .update({

          status:
            'approved',

          approved_by_finance:
            user.nama,

          bukti_bayar:
            fileUrl,

        })
        .eq(
          'id',
          id
        )

      if (
        reimbursementError
      ) {

        console.error(
          reimbursementError
        )

        toast.error(
          'Gagal approve reimbursement'
        )

        return
      }

      toast.success(
        'Payment approved successfully'
      )

      fetchData()

    } catch (error) {

      console.error(error)

      toast.error(
        'Terjadi kesalahan'
      )
    }
  }

  /* =====================
     CHANGE PASSWORD
  ===================== */

  async function handleChangePassword() {

    if (
      !newPassword ||
      !confirmPassword
    ) {

      toast.error(
        'Semua field wajib diisi'
      )

      return
    }

    if (
      newPassword !==
      confirmPassword
    ) {

      toast.error(
        'Password tidak sama'
      )

      return
    }

    if (
      newPassword.length < 6
    ) {

      toast.error(
        'Password minimal 6 karakter'
      )

      return
    }

    try {

      const {
        error
      } = await supabase
        .from('users')
        .update({

          password:
            newPassword

        })
        .eq(
          'id',
          user.id
        )

      if (error) {

        console.error(error)

        toast.error(
          'Gagal mengganti password'
        )

        return
      }

      const updatedUser = {

        ...user,

        password:
          newPassword

      }

      saveUser(
        updatedUser
      )

      setUser(
        updatedUser
      )

      toast.success(
        'Password berhasil diganti'
      )

      setShowPasswordModal(
        false
      )

      setNewPassword('')
      setConfirmPassword('')

    } catch (error) {

      console.error(error)

      toast.error(
        'Terjadi kesalahan'
      )
    }
  }

  useEffect(() => {

    const currentUser =
      getUser()

    if (!currentUser) {

      router.push('/login')

      return
    }

    if (
      currentUser.role !== 'finance'
    ) {

      router.push('/login')

      return
    }

    setUser(currentUser)

    fetchData()

  }, [router])

  /* =====================
     FILTERED DATA
  ===================== */

  const filteredData =
    useMemo(() => {

      return reimbursements.filter(
        (item) => {

          /* SEARCH */

          const matchesSearch =

            item.nama
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||

            item.jenis_claim
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              )

          /* STATUS */

          const matchesStatus =

            statusFilter ===
              'all' ||

            item.status ===
              statusFilter

          /* MONTH */

          const itemMonth =
            format(
              new Date(
                item.created_at
              ),
              'MMMM'
            )

          const matchesMonth =

            monthFilter ===
              'all' ||

            itemMonth ===
              monthFilter

          return (
            matchesSearch &&
            matchesStatus &&
            matchesMonth
          )
        }
      )

    }, [

      reimbursements,

      search,

      statusFilter,

      monthFilter,

    ])

  if (!user || loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-slate-100">

        <div className="text-slate-500 text-xl">
          Loading Finance Dashboard...
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

          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">

            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
            />

          </div>

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Finance Dashboard
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

          {/* CHANGE PASSWORD */}
          <button
            onClick={() =>
              setShowPasswordModal(
                true
              )
            }
            className="w-12 h-12 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-all flex items-center justify-center text-blue-600"
          >

            <KeyRound size={20} />

          </button>

          {/* LOGOUT */}
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
            Finance Reimbursement Approval
          </h2>

          <p className="text-slate-500 mt-2 text-lg">
            Approve reimbursement payment and upload transfer proof
          </p>

        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* TOTAL */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">

              <Wallet
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
              Pending Finance
            </p>

            <h3 className="text-5xl font-bold text-slate-900 mt-3">
              {pendingFinance}
            </h3>

          </div>

          {/* COMPLETED */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">

              <BadgeCheck
                className="text-emerald-600"
                size={30}
              />

            </div>

            <p className="text-slate-500 text-lg">
              Payment Completed
            </p>

            <h3 className="text-5xl font-bold text-slate-900 mt-3">
              {completedPayment}
            </h3>

          </div>

        </div>

        {/* FILTER */}
        <div className="mt-8 flex flex-col lg:flex-row gap-4">

          {/* SEARCH */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex-1">

            <Search
              size={20}
              className="text-slate-400"
            />

            <input
              type="text"
              placeholder="Search reimbursement..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="outline-none bg-transparent text-slate-700 w-full"
            />

          </div>

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm text-slate-700"
          >

            <option value="all">
              All Status
            </option>

            <option value="pending_finance">
              Pending Finance
            </option>

            <option value="approved">
              Approved
            </option>

          </select>

          {/* MONTH */}
          <select
            value={monthFilter}
            onChange={(e) =>
              setMonthFilter(
                e.target.value
              )
            }
            className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm text-slate-700"
          >

            <option value="all">
              All Month
            </option>

            <option value="January">
              January
            </option>

            <option value="February">
              February
            </option>

            <option value="March">
              March
            </option>

            <option value="April">
              April
            </option>

            <option value="May">
              May
            </option>

            <option value="June">
              June
            </option>

            <option value="July">
              July
            </option>

            <option value="August">
              August
            </option>

            <option value="September">
              September
            </option>

            <option value="October">
              October
            </option>

            <option value="November">
              November
            </option>

            <option value="December">
              December
            </option>

          </select>

        </div>

        {/* TABLE */}
        <div className="mt-10 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

          {/* HEADER */}
          <div className="px-8 py-6 border-b border-slate-200">

            <h2 className="text-2xl font-bold text-slate-900">
              Finance Approval Requests
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
                    Receipt
                  </th>

                  <th className="text-left px-8 py-5 text-slate-500 font-semibold">
                    Payment
                  </th>

                </tr>

              </thead>

              <tbody>

                {
                  filteredData.length === 0 && (

                    <tr>

                      <td
                        colSpan={7}
                        className="px-8 py-10 text-center text-slate-500"
                      >

                        No reimbursement data found

                      </td>

                    </tr>

                  )
                }

                {
                  filteredData.map(
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
                            item.status === 'pending_finance'
                              ? (

                                <div className="space-y-3">

                                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">

                                    <Upload size={16} />

                                    Upload Proof

                                    <input
                                      type="file"
                                      hidden
                                      onChange={(e) => {

                                        if (
                                          e.target.files &&
                                          e.target.files[0]
                                        ) {

                                          setPaymentFiles({

                                            ...paymentFiles,

                                            [item.id]:
                                              e.target.files[0]

                                          })
                                        }

                                      }}
                                    />

                                  </label>

                                  <button
                                    onClick={() =>
                                      handleApprove(
                                        item.id
                                      )
                                    }
                                    className="px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 transition-all text-emerald-700 font-medium"
                                  >

                                    Approve Payment

                                  </button>

                                </div>

                              )
                              : (

                                <div className="space-y-2">

                                  <div className="text-emerald-600 font-medium">
                                    Completed
                                  </div>

                                  {
                                    item.bukti_bayar && (

                                      <a
                                        href={
                                          item.bukti_bayar
                                        }
                                        target="_blank"
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                                      >

                                        <Eye size={16} />

                                        View Payment Proof

                                      </a>

                                    )
                                  }

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

      {/* PASSWORD MODAL */}
      {
        showPasswordModal && (

          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-5">

            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">

              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Change Password
              </h2>

              <div className="space-y-5">

                {/* NEW PASSWORD */}
                <div>

                  <label className="text-slate-700 font-medium">
                    New Password
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password"
                  />

                </div>

                {/* CONFIRM */}
                <div>

                  <label className="text-slate-700 font-medium">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm password"
                  />

                </div>

                {/* BUTTON */}
                <div className="flex gap-3 pt-3">

                  <button
                    onClick={() =>
                      setShowPasswordModal(
                        false
                      )
                    }
                    className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all font-semibold text-slate-700"
                  >

                    Cancel

                  </button>

                  <button
                    onClick={
                      handleChangePassword
                    }
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-all font-semibold text-white"
                  >

                    Save Password

                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }

    </div>
  )
}