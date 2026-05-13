'use client'

import Image from 'next/image'

import {
  Wallet,
  Receipt,
  LogOut,
  CircleDollarSign,
  TrendingUp,
  PiggyBank,
  Search,
  Eye,
  X,
  BadgeCheck,
  Clock3,
  KeyRound,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useRouter }
from 'next/navigation'

import {
  format
} from 'date-fns'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip,
} from 'recharts'

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

  const [employee,
    setEmployee] =
    useState<any>(null)

  const [reimbursements,
    setReimbursements] =
    useState<any[]>([])

  const [loading,
    setLoading] =
    useState(true)

  const [chartData,
    setChartData] =
    useState<any[]>([])

  const [usedPlafond,
    setUsedPlafond] =
    useState(0)

  const [pendingAmount,
    setPendingAmount] =
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
     MODAL
  ===================== */

  const [selectedItem,
    setSelectedItem] =
    useState<any>(null)
    /* =====================
   CHANGE PASSWORD
===================== */

const [showPasswordModal,
  setShowPasswordModal] =
  useState(false)

const [oldPassword,
  setOldPassword] =
  useState('')

const [newPassword,
  setNewPassword] =
  useState('')

const [confirmPassword,
  setConfirmPassword] =
  useState('')

const [passwordLoading,
  setPasswordLoading] =
  useState(false)

  async function fetchData(
    currentUser: any
  ) {

    /* EMPLOYEE */

    const {
      data: employeeData,
      error: employeeError
    } = await supabase
      .from('employees')
      .select('*')
      .eq(
        'nama',
        currentUser.nama
      )
      .single()

    if (
      employeeError ||
      !employeeData
    ) {

      console.error(
        employeeError
      )

      setLoading(false)

      return
    }

    setEmployee(employeeData)

    /* REIMBURSEMENTS */

    const {
      data,
      error
    } = await supabase
      .from('reimbursements')
      .select('*')
      .eq(
        'nama',
        currentUser.nama
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )

    if (error) {

      console.error(error)

      setLoading(false)

      return
    }

    setReimbursements(data)

/* =====================
   APPROVED
===================== */

const approved =
  data.filter(
    (item) =>
      item.status ===
      'approved'
  )

const approvedTotal =
  approved.reduce(
    (total, item) =>
      total +
      Number(
        item.nominal
      ),
    0
  )

setUsedPlafond(
  approvedTotal
)

/* =====================
   SMART REMAINING PLAFOND
===================== */

/*
  LOGIC:

  1. Kalau HR isi manual:
     pakai sisa_plafond

  2. Kalau kosong / NULL:
     auto calculate

  FORMULA:
  plafond - approved reimbursement
*/

const hasManualOverride =

  employeeData
    .sisa_plafond !==
    null &&
  employeeData
    .sisa_plafond !==
    undefined

const calculatedRemaining =

  Number(
    employeeData.plafond
  ) -
  approvedTotal

const finalRemainingPlafond =

  hasManualOverride
    ? Number(
        employeeData.sisa_plafond
      )
    : calculatedRemaining

/* UPDATE EMPLOYEE */

setEmployee({

  ...employeeData,

  sisa_plafond:
    finalRemainingPlafond

})

/* =====================
   PENDING
===================== */

const pending =
  data.filter(
    (item) =>
      item.status ===
        'pending_hr' ||
      item.status ===
        'pending_finance'
  )

const pendingTotal =
  pending.reduce(
    (total, item) =>
      total +
      Number(
        item.nominal
      ),
    0
  )

setPendingAmount(
  pendingTotal
)

    /* CHART */

    const monthlyMap:
      Record<
        string,
        number
      > = {}

    approved.forEach(
      (item) => {

        const month =
          format(
            new Date(
              item.created_at
            ),
            'MMM yyyy'
          )

        if (
          !monthlyMap[
            month
          ]
        ) {

          monthlyMap[
            month
          ] = 0
        }

        monthlyMap[
          month
        ] += Number(
          item.nominal
        )
      }
    )

    const chart =
      Object.entries(
        monthlyMap
      ).map(
        ([month, total]) => ({

          month,

          total,

        })
      )

    setChartData(chart)

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
      currentUser.role !==
      'employee'
    ) {

      router.push('/login')

      return
    }

    setUser(currentUser)

    fetchData(currentUser)

  }, [router])

  /* FILTERED DATA */
/* =====================
   CHANGE PASSWORD
===================== */

async function handleChangePassword() {

  if (!oldPassword ||
      !newPassword ||
      !confirmPassword) {

    alert(
      'Please complete all fields'
    )

    return
  }

  if (
    newPassword !==
    confirmPassword
  ) {

    alert(
      'New password confirmation does not match'
    )

    return
  }

  if (
    oldPassword !==
    user.password
  ) {

    alert(
      'Old password is incorrect'
    )

    return
  }

  try {

    setPasswordLoading(true)

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

      alert(
        'Failed to change password'
      )

      return
    }

    /* UPDATE LOCAL STORAGE */

    const updatedUser = {

      ...user,

      password:
        newPassword

    }

    localStorage.setItem(
      'user',
      JSON.stringify(
        updatedUser
      )
    )

    setUser(updatedUser)

    alert(
      'Password updated successfully'
    )

    setShowPasswordModal(
      false
    )

    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')

  } catch (error) {

    console.error(error)

    alert(
      'Something went wrong'
    )

  } finally {

    setPasswordLoading(false)

  }
}
  const filteredData =
    useMemo(() => {

      return reimbursements.filter(
        (item) => {

          const matchesSearch =

            item.jenis_claim
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||

            item.status
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              )

          const matchesStatus =

            statusFilter ===
              'all' ||

            item.status ===
              statusFilter

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

  if (
    !user ||
    !employee ||
    loading
  ) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-slate-100">

        <div className="text-slate-500 text-xl">
          Loading dashboard...
        </div>

      </div>

    )
  }

  const plafondPercentage =
    (usedPlafond /
      employee.plafond) *
    100

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">

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
              Employee Dashboard
            </h1>

            <p className="text-slate-500">
              Medical Reimbursement System
            </p>

          </div>

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

  {/* USER */}
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
      setShowPasswordModal(true)
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
            Welcome back, {user.nama}
          </h2>

          <p className="text-slate-500 mt-2 text-lg">
            Monitor your reimbursement activity and plafond usage
          </p>

        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* TOTAL */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">

              <PiggyBank
                className="text-blue-600"
                size={30}
              />

            </div>

            <p className="text-slate-500 text-lg">
              Total Plafond
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mt-3">

              {
                formatRupiah(
                  employee.plafond
                )
              }

            </h3>

          </div>

          {/* REMAINING */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">

              <Wallet
                className="text-emerald-600"
                size={30}
              />

            </div>

            <p className="text-slate-500 text-lg">
              Remaining Plafond
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mt-3">

              {
                formatRupiah(
                  employee.sisa_plafond
                )
              }

            </h3>

          </div>

          {/* USED */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-6">

              <Receipt
                className="text-red-600"
                size={30}
              />

            </div>

            <p className="text-slate-500 text-lg">
              Used Plafond
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mt-3">

              {
                formatRupiah(
                  usedPlafond
                )
              }

            </h3>

          </div>

          {/* PENDING */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">

            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">

              <TrendingUp
                className="text-amber-600"
                size={30}
              />

            </div>

            <p className="text-slate-500 text-lg">
              Pending Amount
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mt-3">

              {
                formatRupiah(
                  pendingAmount
                )
              }

            </h3>

          </div>

        </div>

        {/* PROGRESS */}
        <div className="mt-8 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Plafond Usage
              </h2>

              <p className="text-slate-500 mt-1">
                Total reimbursement usage this year
              </p>

            </div>

            <div className="text-right">

              <h3 className="text-3xl font-bold text-slate-900">

                {
                  plafondPercentage.toFixed(0)
                }%

              </h3>

              <p className="text-slate-500">
                Used
              </p>

            </div>

          </div>

          <div className="w-full h-5 rounded-full bg-slate-100 overflow-hidden">

            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
              style={{
                width: `${plafondPercentage}%`
              }}
            />

          </div>

        </div>

        {/* CHART */}
        <div className="mt-8 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">

          <div className="mb-6">

            <h2 className="text-2xl font-bold text-slate-900">
              Monthly Reimbursement Trend
            </h2>

            <p className="text-slate-500 mt-1">
              Approved reimbursement activity
            </p>

          </div>

          <div className="h-[350px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <AreaChart
                data={chartData}
              >

                <defs>

                  <linearGradient
                    id="colorTotal"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="5%"
                      stopColor="#2563EB"
                      stopOpacity={0.4}
                    />

                    <stop
                      offset="95%"
                      stopColor="#2563EB"
                      stopOpacity={0}
                    />

                  </linearGradient>

                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="month"
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#2563EB"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* ACTION */}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          {/* BUTTON */}
          <button
            onClick={() =>
              router.push(
                '/employee/submit'
              )
            }
            className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-all text-white font-semibold text-lg shadow-lg"
          >

            <CircleDollarSign
              size={24}
            />

            Submit Reimbursement

          </button>

          {/* FILTERS */}
          <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">

            {/* SEARCH */}
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">

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
                className="outline-none bg-transparent text-slate-700 w-full lg:w-60"
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

              <option value="pending_hr">
                Pending HR
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

                  <th className="text-left px-8 py-5 text-slate-500 font-semibold">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {
                  filteredData.length === 0 && (

                    <tr>

                      <td
                        colSpan={5}
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
                        className="border-t border-slate-100 hover:bg-slate-50 transition-all"
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

                        {/* ACTION */}
                        <td className="px-8 py-6">

                          <button
                            onClick={() =>
                              setSelectedItem(
                                item
                              )
                            }
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 transition-all text-blue-700 font-medium"
                          >

                            <Eye size={18} />

                            Detail

                          </button>

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

      {/* MODAL */}
      {
        selectedItem && (

          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-5">

            <div className="w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden">

              {/* HEADER */}
              <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">

                <div>

                  <h2 className="text-3xl font-bold text-slate-900">
                    Reimbursement Detail
                  </h2>

                  <p className="text-slate-500 mt-1">
                    Complete reimbursement information
                  </p>

                </div>

                <button
                  onClick={() =>
                    setSelectedItem(null)
                  }
                  className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center"
                >

                  <X size={22} />

                </button>

              </div>

              {/* BODY */}
              <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">

                {/* STATUS */}
                <div className="flex items-center gap-4">

                  {
                    selectedItem.status ===
                    'approved'
                      ? (
                        <BadgeCheck
                          className="text-emerald-600"
                          size={36}
                        />
                      )
                      : (
                        <Clock3
                          className="text-amber-600"
                          size={36}
                        />
                      )
                  }

                  <div>

                    <h3 className="text-2xl font-bold text-slate-900 capitalize">

                      {
                        selectedItem.status
                      }

                    </h3>

                    <p className="text-slate-500">
                      Current reimbursement status
                    </p>

                  </div>

                </div>

                {/* GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* CLAIM */}
                  <div className="bg-slate-50 rounded-3xl p-6">

                    <p className="text-slate-500 mb-2">
                      Claim Type
                    </p>

                    <h3 className="text-xl font-bold text-slate-900">

                      {
                        selectedItem.jenis_claim
                      }

                    </h3>

                  </div>

                  {/* AMOUNT */}
                  <div className="bg-slate-50 rounded-3xl p-6">

                    <p className="text-slate-500 mb-2">
                      Amount
                    </p>

                    <h3 className="text-xl font-bold text-slate-900">

                      {
                        formatRupiah(
                          selectedItem.nominal
                        )
                      }

                    </h3>

                  </div>

                  {/* DATE */}
                  <div className="bg-slate-50 rounded-3xl p-6">

                    <p className="text-slate-500 mb-2">
                      Treatment Date
                    </p>

                    <h3 className="text-xl font-bold text-slate-900">

                      {
                        selectedItem.tanggal_pengobatan
                          ? format(
                              new Date(
                                selectedItem.tanggal_pengobatan
                              ),
                              'dd MMMM yyyy'
                            )
                          : '-'
                      }

                    </h3>

                  </div>

                  {/* CLAIM NUMBER */}
                  <div className="bg-slate-50 rounded-3xl p-6">

                    <p className="text-slate-500 mb-2">
                      Claim Number
                    </p>

                    <h3 className="text-xl font-bold text-slate-900">

                      {
                        selectedItem.claim_number ||
                        '-'
                      }

                    </h3>

                  </div>

                </div>

                {/* NOTE */}
                <div className="bg-slate-50 rounded-3xl p-6">

                  <p className="text-slate-500 mb-3">
                    Notes
                  </p>

                  <p className="text-slate-800 leading-relaxed">

                    {
                      selectedItem.catatan ||
                      'Tidak ada catatan'
                    }

                  </p>

                </div>

                {/* APPROVAL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* HR */}
                  <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">

                    <p className="text-blue-600 mb-2 font-medium">
                      HR Approval
                    </p>

                    <h3 className="text-xl font-bold text-slate-900">

                      {
                        selectedItem.approved_by_hr ||
                        'Waiting Approval'
                      }

                    </h3>

                  </div>

                  {/* FINANCE */}
                  <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">

                    <p className="text-emerald-600 mb-2 font-medium">
                      Finance Approval
                    </p>

                    <h3 className="text-xl font-bold text-slate-900">

                      {
                        selectedItem.approved_by_finance ||
                        'Waiting Approval'
                      }

                    </h3>

                  </div>

                </div>

                {/* FILES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* RECEIPT */}
                  <div className="bg-slate-50 rounded-3xl p-6">

                    <p className="text-slate-500 mb-4">
                      Receipt File
                    </p>

                    {
                      selectedItem.bukti_kuitansi
                        ? (

                          <a
                            href={
                              selectedItem.bukti_kuitansi
                            }
                            target="_blank"
                            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-100 hover:bg-blue-200 transition-all text-blue-700 font-medium"
                          >

                            <Eye size={20} />

                            View Receipt

                          </a>

                        )
                        : (

                          <p className="text-slate-400">
                            No file
                          </p>

                        )
                    }

                  </div>

                  {/* PAYMENT */}
                  <div className="bg-slate-50 rounded-3xl p-6">

                    <p className="text-slate-500 mb-4">
                      Payment Proof
                    </p>

                    {
                      selectedItem.bukti_bayar
                        ? (

                          <a
                            href={
                              selectedItem.bukti_bayar
                            }
                            target="_blank"
                            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-100 hover:bg-emerald-200 transition-all text-emerald-700 font-medium"
                          >

                            <Eye size={20} />

                            View Payment Proof

                          </a>

                        )
                        : (

                          <p className="text-slate-400">
                            Waiting finance payment
                          </p>

                        )
                    }

                  </div>

                </div>

              </div>

            </div>

          </div>

        )
      }

    {/* =====================
   CHANGE PASSWORD MODAL
===================== */}

{
  showPasswordModal && (

    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-5">

      <div className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">

          <div>

            <h2 className="text-3xl font-bold text-slate-900">
              Change Password
            </h2>

            <p className="text-slate-500 mt-1">
              Update your account password
            </p>

          </div>

          <button
            onClick={() =>
              setShowPasswordModal(false)
            }
            className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center"
          >

            <X size={22} />

          </button>

        </div>

        {/* BODY */}
        <div className="p-8 space-y-6">

          {/* OLD PASSWORD */}
          <div>

            <label className="text-slate-700 font-medium">
              Old Password
            </label>

            <input
              type="password"
              value={oldPassword}
              onChange={(e) =>
                setOldPassword(
                  e.target.value
                )
              }
              placeholder="Enter old password"
              className="mt-3 w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

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
              placeholder="Enter new password"
              className="mt-3 w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* CONFIRM PASSWORD */}
          <div>

            <label className="text-slate-700 font-medium">
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Confirm new password"
              className="mt-3 w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* BUTTON */}
          <button
            onClick={
              handleChangePassword
            }
            disabled={
              passwordLoading
            }
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-all text-white font-semibold text-lg shadow-lg disabled:opacity-50"
          >

            {
              passwordLoading
                ? 'Updating Password...'
                : 'Update Password'
            }

          </button>

        </div>

      </div>

    </div>

  )
}
    </div>
  )
}