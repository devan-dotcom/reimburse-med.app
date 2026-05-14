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
  LayoutDashboard,
  History,
} from 'lucide-react'
import { motion } from 'framer-motion'

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
    const [activeMenu,
  setActiveMenu] =
  useState('dashboard')
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe,_#f8fafc_35%,_#eef2ff_100%)] flex relative overflow-hidden">

  {/* BACKGROUND BLUR */}
  <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-300/20 rounded-full blur-3xl" />

  <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-3xl" />
      {/* SIDEBAR */}
<aside className="w-80 hidden lg:flex flex-col px-5 py-5 relative z-10">

  <div className="h-full rounded-[32px] bg-white/80 backdrop-blur-xl border border-white shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden flex flex-col">

    {/* TOP */}
    <div className="px-7 py-8 border-b border-slate-100">

      <div className="flex flex-col items-center text-center">

        <div className="w-28 h-28 rounded-[32px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_10px_30px_rgba(15,23,42,0.08)] flex items-center justify-center">

          <Image
            src="/logo.png"
            alt="Logo"
            width={72}
            height={72}
            className="object-contain"
          />

        </div>

        <div className="mt-7">

          <h1 className="text-[36px] font-bold tracking-tight text-slate-900">
            Employee
          </h1>

          <p className="text-slate-400 text-lg mt-3">
            Medical Reimbursement
          </p>

        </div>

      </div>

    </div>

    {/* MENU */}
    <div className="flex-1 px-5 py-6">

      <div className="space-y-3">

        {/* DASHBOARD */}
        <button
          onClick={() =>
            setActiveMenu(
              'dashboard'
            )
          }
          className={`
            w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all

            ${
              activeMenu === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'hover:bg-slate-100 text-slate-700'
            }
          `}
        >

          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center

            ${
              activeMenu === 'dashboard'
                ? 'bg-white/10'
                : 'bg-slate-100'
            }
          `}>

            <LayoutDashboard
              size={22}
            />

          </div>

          <div className="text-left">

            <h3 className="font-semibold">
              Dashboard
            </h3>

            <p className={`
              text-xs mt-1

              ${
                activeMenu === 'dashboard'
                  ? 'text-cyan-100'
                  : 'text-slate-400'
              }
            `}>
              Reimbursement overview
            </p>

          </div>

        </button>

        {/* RECENT */}
        <button
          onClick={() =>
            setActiveMenu(
              'recent'
            )
          }
          className={`
            w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all

            ${
              activeMenu === 'recent'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'hover:bg-slate-100 text-slate-700'
            }
          `}
        >

          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center

            ${
              activeMenu === 'recent'
                ? 'bg-white/10'
                : 'bg-slate-100'
            }
          `}>

            <History
              size={22}
            />

          </div>

          <div className="text-left">

            <h3 className="font-semibold">
              Recent Reimbursement
            </h3>

            <p className={`
              text-xs mt-1

              ${
                activeMenu === 'recent'
                  ? 'text-cyan-100'
                  : 'text-slate-400'
              }
            `}>
              View reimbursement history
            </p>

          </div>

        </button>

      </div>

    </div>

    {/* BOTTOM */}
    <div className="p-5 border-t border-slate-100 space-y-3">

      {/* PASSWORD */}
      <button
        onClick={() =>
          setShowPasswordModal(true)
        }
        className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all"
      >

        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">

          <KeyRound size={20} />

        </div>

        <div className="text-left">

          <h3 className="font-semibold">
            Change Password
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Update account security
          </p>

        </div>

      </button>

      {/* LOGOUT */}
      <button
        onClick={logout}
        className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all"
      >

        <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center">

          <LogOut size={20} />

        </div>

        <div className="text-left">

          <h3 className="font-semibold">
            Logout
          </h3>

          <p className="text-xs text-red-300 mt-1">
            Exit dashboard session
          </p>

        </div>

      </button>

    </div>

  </div>

</aside>
{/* RIGHT CONTENT */}
<div className="flex-1 flex flex-col min-w-0">
      {/* HEADER */}
      <header className="sticky top-0 z-10 px-8 py-6">

  <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] px-8 py-6 flex items-center justify-between">

    {/* LEFT */}
    <div>

      <div className="flex items-center gap-3">

        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">

          <Wallet
            size={22}
            className="text-white"
          />

        </div>

        <div>

          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Employee Dashboard
          </h1>

          <p className="text-slate-500 mt-1">
            Monitor reimbursement activity and plafond usage
          </p>

        </div>

      </div>

    </div>

    {/* RIGHT */}
    <div className="hidden md:flex items-center gap-5">

      <div className="text-right">

        <p className="text-sm text-slate-400">
          Today
        </p>

        <h3 className="font-semibold text-slate-800">

          {
            format(
              new Date(),
              'dd MMM yyyy'
            )
          }

        </h3>

      </div>

      <div className="w-px h-12 bg-slate-200" />

      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">

        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />

        <div>

          <p className="text-xs text-emerald-600">
            System Status
          </p>

          <h3 className="font-semibold text-emerald-700">
            Operational
          </h3>

        </div>

      </div>

    </div>

  </div>

</header>

      {/* CONTENT */}
      <main className="p-8">
        <div className="max-w-[1600px] mx-auto">

        {/* =====================
CONTENT WRAPPER
===================== */}

<main className="p-8">

  <div className="max-w-[1600px] mx-auto">

    {/* =====================
    DASHBOARD CONTENT
    ===================== */}

    {
      activeMenu === 'dashboard' && (

        <>

          {/* CARDS */}
<motion.div
  initial={{
    opacity: 0,
    y: 20,
  }}
  animate={{
    opacity: 1,
    y: 0,
  }}
  transition={{
    duration: 0.5,
  }}
  className="grid grid-cols-1 xl:grid-cols-4 gap-7"
>

  {/* TOTAL */}
  <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/60 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10">

    <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">

      <PiggyBank
        className="text-blue-600"
        size={30}
      />

    </div>

    <p className="text-slate-500 text-lg">
      Total Plafond
    </p>

    <h3 className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">

      {
        formatRupiah(
          employee.plafond
        )
      }

    </h3>

    <p className="text-sm text-slate-400 mt-2">
      Annual reimbursement allocation
    </p>

  </div>

  {/* REMAINING */}
  <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/60 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10">

    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">

      <Wallet
        className="text-emerald-600"
        size={30}
      />

    </div>

    <p className="text-slate-500 text-lg">
      Remaining Plafond
    </p>

    <h3 className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">

      {
        formatRupiah(
          employee.sisa_plafond
        )
      }

    </h3>

    <p className="text-sm text-slate-400 mt-2">
      Available reimbursement balance
    </p>

  </div>

  {/* USED */}
  <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/60 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/10">

    <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-6">

      <Receipt
        className="text-red-600"
        size={30}
      />

    </div>

    <p className="text-slate-500 text-lg">
      Used Plafond
    </p>

    <h3 className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">

      {
        formatRupiah(
          usedPlafond
        )
      }

    </h3>

    <p className="text-sm text-slate-400 mt-2">
      Approved reimbursement amount
    </p>

  </div>

  {/* PENDING */}
  <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/60 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10">

    <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">

      <TrendingUp
        className="text-amber-600"
        size={30}
      />

    </div>

    <p className="text-slate-500 text-lg">
      Pending Amount
    </p>

    <h3 className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">

      {
        formatRupiah(
          pendingAmount
        )
      }

    </h3>

    <p className="text-sm text-slate-400 mt-2">
      Waiting HR & Finance approval
    </p>

  </div>

</motion.div>

{/* PROGRESS */}
<div className="mt-8 bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/60 p-8 shadow-sm transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10">

  <div className="flex items-center justify-between mb-5">

    <div>

      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
        Plafond Usage
      </h2>

      <p className="text-slate-500 mt-1">
        Total reimbursement usage this year
      </p>

    </div>

    <div className="text-right">

      <h3 className="text-4xl font-bold text-slate-900 tracking-tight">

        {
          plafondPercentage.toFixed(0)
        }%

      </h3>

      <p className="text-slate-500 mt-1">
        Used
      </p>

    </div>

  </div>

  {/* PROGRESS BAR */}
  <div className="w-full h-5 rounded-full bg-slate-100 overflow-hidden">

    <motion.div
      initial={{
        width: 0,
      }}
      animate={{
        width: `${plafondPercentage}%`,
      }}
      transition={{
        duration: 1,
      }}
      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
    />

  </div>

  {/* FOOTER */}
  <div className="flex items-center justify-between mt-5 text-sm text-slate-500">

    <span>
      {
        formatRupiah(
          usedPlafond
        )
      } used
    </span>

    <span>
      {
        formatRupiah(
          employee.sisa_plafond
        )
      } remaining
    </span>

  </div>

</div>

          {/* CHART */}
          <div className="mt-8 bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/60 p-8 shadow-sm border border-slate-200">

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
  strokeWidth={4}
  activeDot={{ r: 8 }}
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
                className="relative z-50 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-5 py-4 shadow-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
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
                className="relative z-50 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-5 py-4 shadow-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
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

        </>

      )
    }

    {/* =====================
    RECENT CONTENT
    ===================== */}

    {
      activeMenu === 'recent' && (

        <div className="mt-10">

          {/* TABLE */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">

            {/* HEADER */}
            <div className="px-8 py-7 border-b border-slate-100 flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Recent Reimbursements
                </h2>

                <p className="text-slate-500 mt-1">
                  Monitor your reimbursement submission history
                </p>

              </div>

            </div>

          </div>

        </div>

      )
    }

  </div>

</main>
{
  activeMenu === 'recent' && (

    <div className="mt-10">

      {/* TABLE */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">

        {/* HEADER */}
        <div className="px-8 py-7 border-b border-slate-100 flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Recent Reimbursements
            </h2>

            <p className="text-slate-500 mt-1">
              Monitor your reimbursement submission history
            </p>

          </div>

          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100">

            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />

            <span className="text-sm font-medium text-slate-600">
              Live Data
            </span>

          </div>

        </div>

        {/* TABLE CONTENT */}
        <div className="px-4 pb-4 overflow-x-auto">

          <table className="w-full border-separate border-spacing-y-3">

            <thead>

              <tr>

                <th className="text-left px-8 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  Claim
                </th>

                <th className="text-left px-8 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  Date
                </th>

                <th className="text-left px-8 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  Amount
                </th>

                <th className="text-left px-8 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  Status
                </th>

                <th className="text-left px-8 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">
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
                      className="px-8 py-16 text-center text-slate-400"
                    >

                      <div className="flex flex-col items-center justify-center py-16">

  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">

    <Receipt
      size={40}
      className="text-slate-400"
    />

  </div>

  <h3 className="text-2xl font-bold text-slate-700">
    No reimbursement yet
  </h3>

  <p className="text-slate-400 mt-2">
    Your reimbursement history will appear here
  </p>

</div>

                    </td>

                  </tr>

                )
              }

              {
                filteredData.map(
                  (item) => (

                    <tr
                      key={item.id}
                      className="bg-white hover:bg-slate-50 transition-all duration-300"
                    >

                      {/* CLAIM */}
                      <td className="px-8 py-5 rounded-l-3xl">

                        <div className="flex items-center gap-4">

                          <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center">

                            <Receipt
                              size={20}
                              className="text-cyan-600"
                            />

                          </div>

                          <div>

                            <h3 className="font-semibold text-slate-900 capitalize">

                              {
                                item.jenis_claim
                              }

                            </h3>

                            <p className="text-sm text-slate-400 mt-1">
                              Medical reimbursement
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* DATE */}
                      <td className="px-8 py-5 text-slate-500 font-medium">

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

                      {/* AMOUNT */}
                      <td className="px-8 py-5">

                        <span className="text-lg font-bold text-slate-900">

                          {
                            formatRupiah(
                              item.nominal
                            )
                          }

                        </span>

                      </td>

                      {/* STATUS */}
                      <td className="px-8 py-5">

                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(item.status)}`}
                        >

                          <div className="w-2 h-2 rounded-full bg-current opacity-70" />

                          {
  item.status === 'pending_hr'
    ? 'Pending HR'
    : item.status === 'pending_finance'
    ? 'Pending Finance'
    : item.status === 'approved'
    ? 'Approved'
    : item.status
}

                        </span>

                      </td>

                      {/* ACTION */}
                      <td className="px-8 py-5 rounded-r-3xl">

                        <button
                          onClick={() =>
                            setSelectedItem(
                              item
                            )
                          }
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all text-white font-semibold shadow-lg shadow-cyan-500/20"
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

    </div>

  )
}
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
          <div className="relative z-50 flex items-center gap-4">

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

      </main>

    </div>

  </div>

  )
}