'use client'

import Image from 'next/image'
import {
  ShieldCheck,
  Clock3,
  CheckCircle2,
  LogOut,
  Eye,
  XCircle,
  Search,
  X,
  Users,
  Pencil,
  Save,
  KeyRound,
  LayoutDashboard,
  Receipt,
  Settings,
  RotateCcw, // Tambahan icon untuk tombol Reset
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

import { supabase } from '@/lib/supabase'
import { getUser, logout } from '@/lib/auth'
import { formatRupiah } from '@/lib/format'
import { getStatusColor } from '@/lib/status'

import {

  cardStyle,
  cardPadding,
  inputStyle,
  selectStyle,
  primaryButton,
  secondaryButton,
  successButton,
  dangerButton,
  tableHeader,
  tableCell,
  modalOverlay,
  modalContainer,
  pageContainer,
  contentContainer,
  sectionTitle,
  sectionDescription,

} from '@/lib/ui'

export default function HRDashboard() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  /* SIDEBAR MENU STATE */
  const [activeMenu, setActiveMenu] = useState<'reimbursements' | 'employees'>('reimbursements')

  /* PASSWORD MODAL STATE */
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const [reimbursements, setReimbursements] = useState<any[]>([])
  const [totalData, setTotalData] = useState(0)
  const [pendingHR, setPendingHR] = useState(0)
  const [approvedHR, setApprovedHR] = useState(0)

  /* SEARCH */
  const [search, setSearch] = useState('')

  /* FILTER */
  const [statusFilter, setStatusFilter] = useState('all')

  /* EMPLOYEES */
  const [employees, setEmployees] = useState<any[]>([])

  /* EMPLOYEE MODAL */
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

  /* EDIT FORM */
  const [editPlafond, setEditPlafond] = useState('')
  const [editSisaPlafond, setEditSisaPlafond] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [editJabatan, setEditJabatan] = useState('')

  async function fetchData() {
    const { data, error } = await supabase
      .from('reimbursements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      toast.error('❌ Gagal mengambil data reimburse')
      setLoading(false)
      return
    }

    setReimbursements(data)
    setTotalData(data.length)

    const pending = data.filter((item) => item.status === 'pending_hr')
    setPendingHR(pending.length)

    const approved = data.filter(
      (item) => item.status === 'pending_finance' || item.status === 'approved'
    )
    setApprovedHR(approved.length)

    /* EMPLOYEES */
    const { data: employeeData } = await supabase
      .from('employees')
      .select('*')
      .order('nama')

    if (employeeData) {
      setEmployees(employeeData)
    }
    setLoading(false)
  }

  async function handleApprove(id: number) {
    const { error } = await supabase
      .from('reimbursements')
      .update({
        status: 'pending_finance',
        approved_by_hr: user.nama,
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      toast.error('❌ Gagal approve reimbursement')
      return
    }

    toast.success('✅ Reimbursement berhasil di-approve!')
    fetchData()
  }

  async function handleReject(id: number) {
    const { error } = await supabase
      .from('reimbursements')
      .update({
        status: 'rejected',
        approved_by_hr: user.nama,
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      toast.error('❌ Gagal reject reimbursement')
      return
    }

    toast.success('✅ Reimbursement berhasil di-reject!')
    fetchData()
  }

  /* =====================
     SAVE EMPLOYEE
  ===================== */
  async function handleSaveEmployee() {
    if (!selectedEmployee) {
      return
    }

    const { error } = await supabase
      .from('employees')
      .update({
        plafond: Number(editPlafond),
        sisa_plafond: Number(editSisaPlafond),
        department: editDepartment,
        jabatan: editJabatan,
      })
      .eq('id', selectedEmployee.id)

    if (error) {
      console.error(error)
      toast.error('❌ Gagal update data employee')
      return
    }

    toast.success('✨ Data Employee berhasil di-update!')
    setSelectedEmployee(null)
    fetchData()
  }

  /* =====================
     RESET EMPLOYEE (Plafond & Riwayat)
  ===================== */
  async function handleResetEmployee(employee: any) {
    const confirmReset = window.confirm(`Apakah Anda yakin ingin mereset riwayat reimburse dan memulihkan sisa plafond untuk ${employee.nama}? Aksi ini akan menghapus semua riwayat klaimnya.`)
    
    if (!confirmReset) return

    toast.loading('Sedang mereset data...', { id: 'reset-toast' })

    // 1. Kembalikan sisa_plafond menjadi full (sama dengan plafond)
    const { error: empError } = await supabase
      .from('employees')
      .update({ sisa_plafond: employee.plafond })
      .eq('id', employee.id)

    if (empError) {
      toast.error('❌ Gagal mereset sisa plafond', { id: 'reset-toast' })
      return
    }

    // 2. Hapus seluruh riwayat reimburse yang namanya sama dengan employee ini
    const { error: reimError } = await supabase
      .from('reimbursements')
      .delete()
      .eq('nama', employee.nama)

    if (reimError) {
      toast.error('❌ Gagal menghapus riwayat reimburse', { id: 'reset-toast' })
      return
    }

    toast.success(`🔄 Berhasil mereset data ${employee.nama}!`, { id: 'reset-toast' })
    fetchData()
  }

  /* =====================
     CHANGE PASSWORD LOGIC
  ===================== */
  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) {
      toast.error('⚠️ Password tidak boleh kosong')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('⚠️ Konfirmasi password tidak cocok')
      return
    }

    if (newPassword.length < 6) {
      toast.error('⚠️ Password minimal 6 karakter')
      return
    }

    setIsUpdatingPassword(true)

    // Update password di Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    setIsUpdatingPassword(false)

    if (error) {
      console.error(error)
      toast.error(`❌ Gagal mengubah password: ${error.message}`)
      return
    }

    toast.success('🔑 Password berhasil diubah!')
    setIsPasswordModalOpen(false)
    setNewPassword('')
    setConfirmPassword('')
  }

  const filteredData = reimbursements.filter((item) => {
    const matchesSearch =
      item.nama?.toLowerCase().includes(search.toLowerCase()) ||
      item.jenis_claim?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    const currentUser = getUser()

    if (!currentUser) {
      router.push('/login')
      return
    }

    if (currentUser.role !== 'hr') {
      router.push('/login')
      return
    }

    setUser(currentUser)
    fetchData()
  }, [router])

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-500 text-xl animate-pulse">Loading HR Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      
      {/* =====================
    SIDEBAR
===================== */}
<aside className="w-80 hidden lg:flex flex-col px-5 py-5">

  <div className="h-full rounded-[32px] bg-white/80 backdrop-blur-xl border border-white shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden flex flex-col">

    {/* TOP */}
<div className="px-7 py-8 border-b border-slate-100">

  {/* BRANDING */}
  <div className="flex flex-col items-center text-center">

    {/* LOGO */}
    <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_15px_40px_rgba(6,182,212,0.35)] flex items-center justify-center">

      <Image
        src="/logo.png"
        alt="Logo"
        width={72}
        height={72}
        className="object-contain"
      />

    </div>

    {/* TITLE */}
    <div className="mt-7">

      <h1 className="text-[40px] leading-none font-bold tracking-tight text-slate-900">
        HR Panel
      </h1>

      <p className="text-slate-400 text-xl mt-4 leading-relaxed">

        Medical
        <br />
        Reimbursement

      </p>

    </div>

  </div>

</div>

    {/* NAVIGATION */}
    <div className="flex-1 px-5 py-6 overflow-y-auto">

      <p className="px-4 text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-5">
        Main Navigation
      </p>

      <div className="space-y-3">

        {/* REIMBURSEMENTS */}
        <button
          onClick={() =>
            setActiveMenu(
              'reimbursements'
            )
          }
          className={`group w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 ${
            activeMenu ===
            'reimbursements'

              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'

              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >

          <div className="flex items-center gap-4">

            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                activeMenu ===
                'reimbursements'

                  ? 'bg-white/15'

                  : 'bg-slate-100 group-hover:bg-white'
              }`}
            >

              <Receipt
                size={22}
              />

            </div>

            <div className="text-left">

              <h3 className="font-semibold">
                Reimbursements
              </h3>

              <p
                className={`text-xs mt-1 ${
                  activeMenu ===
                  'reimbursements'

                    ? 'text-cyan-100'

                    : 'text-slate-400'
                }`}
              >
                Approval & monitoring
              </p>

            </div>

          </div>

        </button>

        {/* EMPLOYEES */}
        <button
          onClick={() =>
            setActiveMenu(
              'employees'
            )
          }
          className={`group w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 ${
            activeMenu ===
            'employees'

              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'

              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >

          <div className="flex items-center gap-4">

            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                activeMenu ===
                'employees'

                  ? 'bg-white/15'

                  : 'bg-slate-100 group-hover:bg-white'
              }`}
            >

              <Users
                size={22}
              />

            </div>

            <div className="text-left">

              <h3 className="font-semibold">
                Employee Data
              </h3>

              <p
                className={`text-xs mt-1 ${
                  activeMenu ===
                  'employees'

                    ? 'text-cyan-100'

                    : 'text-slate-400'
                }`}
              >
                Employee management
              </p>

            </div>

          </div>

        </button>

      </div>

    </div>

    {/* BOTTOM */}
    <div className="p-5 border-t border-slate-100 space-y-3">

      {/* PASSWORD */}
      <button
        onClick={() =>
          setIsPasswordModalOpen(
            true
          )
        }
        className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all"
      >

        <div className="w-11 h-11 rounded-2xl bg-slate-100 group-hover:bg-white flex items-center justify-center">

          <KeyRound
            size={20}
          />

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

          <LogOut
            size={20}
          />

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

{/* =====================
    MAIN CONTENT
===================== */}
<div className="flex-1 flex flex-col min-w-0">

  {/* HEADER */}
  <header className="sticky top-0 z-10 px-8 py-6">

    <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] px-8 py-6 flex items-center justify-between">

      {/* LEFT */}
      <div>

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">

            {
              activeMenu ===
              'reimbursements'

                ? (
                  <LayoutDashboard
                    size={22}
                    className="text-white"
                  />
                )

                : (
                  <Users
                    size={22}
                    className="text-white"
                  />
                )
            }

          </div>

          <div>

            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">

              {
                activeMenu ===
                'reimbursements'

                  ? 'HR Dashboard'

                  : 'Employee Management'
              }

            </h1>

            <p className="text-slate-500 mt-1">

              {
                activeMenu ===
                'reimbursements'

                  ? 'Manage reimbursement approval and monitoring'

                  : 'Manage employee reimbursement information'
              }

            </p>

          </div>

        </div>

      </div>

      {/* RIGHT */}
      <div className="hidden md:flex items-center gap-5">

        {/* DATE */}
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

        {/* DIVIDER */}
        <div className="w-px h-12 bg-slate-200" />

        {/* STATUS */}
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
  <main className="px-8 pb-8">
          
          {/* VIEW: REIMBURSEMENTS */}
          {activeMenu === 'reimbursements' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-7">

  {/* TOTAL REIMBURSEMENT */}
  <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.06)] p-8 group hover:-translate-y-1 transition-all duration-300">

    {/* GLOW */}
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-all" />

    {/* TOP */}
    <div className="relative z-10 flex items-start justify-between">

      <div>

        <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">
          Total Reimbursements
        </p>

        <h3 className="text-6xl font-bold text-slate-900 mt-4 tracking-tight">
          {totalData}
        </h3>

      </div>

      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-200">

        <ShieldCheck
          className="text-white"
          size={30}
        />

      </div>

    </div>

    {/* BOTTOM */}
    <div className="relative z-10 mt-8 flex items-center justify-between">

      <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">

        <div className="w-2 h-2 rounded-full bg-emerald-500" />

        Active reimbursement requests

      </div>

      <span className="text-slate-400 text-sm">
        HR Overview
      </span>

    </div>

  </div>

  {/* PENDING HR */}
  <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.06)] p-8 group hover:-translate-y-1 transition-all duration-300">

    {/* GLOW */}
    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-100 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-all" />

    {/* TOP */}
    <div className="relative z-10 flex items-start justify-between">

      <div>

        <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">
          Pending HR
        </p>

        <h3 className="text-6xl font-bold text-slate-900 mt-4 tracking-tight">
          {pendingHR}
        </h3>

      </div>

      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-200">

        <Clock3
          className="text-white"
          size={30}
        />

      </div>

    </div>

    {/* BOTTOM */}
    <div className="relative z-10 mt-8 flex items-center justify-between">

      <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">

        <div className="w-2 h-2 rounded-full bg-amber-500" />

        Need immediate review

      </div>

      <span className="text-slate-400 text-sm">
        Waiting Approval
      </span>

    </div>

  </div>

  {/* APPROVED */}
  <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.06)] p-8 group hover:-translate-y-1 transition-all duration-300">

    {/* GLOW */}
    <div className="absolute -top-10 left-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-all" />

    {/* TOP */}
    <div className="relative z-10 flex items-start justify-between">

      <div>

        <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">
          Approved HR
        </p>

        <h3 className="text-6xl font-bold text-slate-900 mt-4 tracking-tight">
          {approvedHR}
        </h3>

      </div>

      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-200">

        <CheckCircle2
          className="text-white"
          size={30}
        />

      </div>

    </div>

    {/* BOTTOM */}
    <div className="relative z-10 mt-8 flex items-center justify-between">

      <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">

        <div className="w-2 h-2 rounded-full bg-emerald-500" />

        Sent to finance process

      </div>

      <span className="text-slate-400 text-sm">
        Successfully reviewed
      </span>

    </div>

  </div>

</div>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm w-full lg:w-[400px]">
                  <Search size={20} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employee or claim..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="outline-none bg-transparent text-slate-700 w-full"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={selectStyle}
                >
                  <option value="all">All Status</option>
                  <option value="pending_hr">Pending HR</option>
                  <option value="pending_finance">Pending Finance</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">

  {/* HEADER */}
  <div className="px-8 py-7 border-b border-slate-100 flex items-center justify-between">

    <div>

      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
        Reimbursement Requests
      </h2>

      <p className="text-slate-500 mt-1">
        Review and manage employee reimbursement submissions
      </p>

    </div>

    <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100">

      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />

      <span className="text-sm font-medium text-slate-600">
        Live Data
      </span>

    </div>

  </div>

  {/* TABLE */}
  <div className="overflow-x-auto">

    <table className="w-full border-separate border-spacing-y-3">

      <thead className="sticky top-0 z-10">

        <tr>

          <th className="text-left px-8 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">
            Employee
          </th>

          <th className="text-left px-4 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">
            Claim Type
          </th>

          <th className="text-left px-4 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">
            Treatment Date
          </th>

          <th className="text-left px-4 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">
            Amount
          </th>

          <th className="text-left px-4 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">
            Status
          </th>

          <th className="text-left px-4 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">
            Attachment
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
                colSpan={7}
                className="px-8 py-20 text-center"
              >

                <div className="flex flex-col items-center">

                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-5">

                    <Receipt
                      size={36}
                      className="text-slate-400"
                    />

                  </div>

                  <h3 className="text-xl font-bold text-slate-800">
                    No reimbursement data found
                  </h3>

                  <p className="text-slate-500 mt-2">
                    Try adjusting your filters or search keywords
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
                className="group"
              >

                {/* EMPLOYEE */}
                <td className="pl-8 pr-4 py-5 bg-white border-y border-l border-slate-100 rounded-l-3xl shadow-sm group-hover:shadow-md transition-all duration-200">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-blue-700 font-bold">

                      {
                        item.nama
                          ?.charAt(0)
                          ?.toUpperCase()
                      }

                    </div>

                    <div>

                      <h3 className="font-semibold text-slate-900">
                        {item.nama}
                      </h3>

                      <p className="text-sm text-slate-500">
                        Employee
                      </p>

                    </div>

                  </div>

                </td>

                {/* CLAIM */}
                <td className="px-4 py-5 bg-white border-y border-slate-100 shadow-sm group-hover:shadow-md transition-all duration-200">

                  <div>

                    <p className="font-semibold text-slate-800">
                      {item.jenis_claim}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      Medical reimbursement
                    </p>

                  </div>

                </td>

                {/* DATE */}
                <td className="px-4 py-5 bg-white border-y border-slate-100 shadow-sm group-hover:shadow-md transition-all duration-200">

                  <div className="text-slate-700 font-medium">

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

                  </div>

                </td>

                {/* AMOUNT */}
                <td className="px-4 py-5 bg-white border-y border-slate-100 shadow-sm group-hover:shadow-md transition-all duration-200">

                  <div className="font-bold text-slate-900 text-lg">

                    {
                      formatRupiah(
                        item.nominal
                      )
                    }

                  </div>

                </td>

                {/* STATUS */}
                <td className="px-4 py-5 bg-white border-y border-slate-100 shadow-sm group-hover:shadow-md transition-all duration-200">

                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(item.status)}`}
                  >

                    <div className="w-2 h-2 rounded-full bg-current opacity-70" />

                    {item.status}

                  </span>

                </td>

                {/* FILE */}
                <td className="px-4 py-5 bg-white border-y border-slate-100 shadow-sm group-hover:shadow-md transition-all duration-200">

                  <a
                    href={item.bukti_kuitansi}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-all text-blue-700 font-semibold"
                  >

                    <Eye size={18} />

                    View File

                  </a>

                </td>

                {/* ACTION */}
                <td className="pl-4 pr-8 py-5 bg-white border-y border-r border-slate-100 rounded-r-3xl shadow-sm group-hover:shadow-md transition-all duration-200">

                  {
                    item.status === 'pending_hr'
                      ? (

                        <div className="flex items-center gap-3">

                          {/* APPROVE */}
                          <button
                            onClick={() =>
                              handleApprove(
                                item.id
                              )
                            }
                            className={`px-5 py-3 rounded-2xl font-semibold ${successButton}`}
                          >

                            Approve

                          </button>

                          {/* REJECT */}
                          <button
                            onClick={() =>
                              handleReject(
                                item.id
                              )
                            }
                            className={`px-5 py-3 rounded-2xl font-semibold ${dangerButton}`}
                          >

                            Reject

                          </button>

                        </div>

                      )
                      : (

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 font-medium">

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
            </div>
          )}

          {/* VIEW: EMPLOYEES */}
          {activeMenu === 'employees' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Employee List</h2>
                    <p className="text-slate-500 mt-1">Review and manage employee details</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Users className="text-blue-600" size={28} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-8 py-5 text-slate-500 font-semibold">Employee</th>
                        <th className="text-left px-8 py-5 text-slate-500 font-semibold">Department</th>
                        <th className="text-left px-8 py-5 text-slate-500 font-semibold">Plafond</th>
                        <th className="text-left px-8 py-5 text-slate-500 font-semibold">Remaining</th>
                        <th className="text-left px-8 py-5 text-slate-500 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-6 font-medium text-slate-800">{employee.nama}</td>
                          <td className="px-8 py-6 text-slate-600">{employee.department || '-'}</td>
                          <td className="px-8 py-6 font-semibold text-slate-900">
                            {formatRupiah(employee.plafond || 0)}
                          </td>
                          <td className="px-8 py-6 font-semibold text-emerald-700">
                            {formatRupiah(employee.sisa_plafond || 0)}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setEditPlafond(employee.plafond?.toString() || '')
                                  setEditSisaPlafond(employee.sisa_plafond?.toString() || '')
                                  setEditDepartment(employee.department || '')
                                  setEditJabatan(employee.jabatan || '')
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 transition-all text-blue-700 font-medium active:scale-95"
                              >
                                <Pencil size={18} /> Edit
                              </button>
                              
                              {/* TOMBOL RESET PLAFOND */}
                              <button
                                onClick={() => handleResetEmployee(employee)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 transition-all text-red-700 font-medium active:scale-95"
                                title="Hapus riwayat dan reset sisa plafond"
                              >
                                <RotateCcw size={18} /> Reset
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =====================
              EDIT EMPLOYEE MODAL
          ===================== */}
          {selectedEmployee && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-in fade-in duration-200">
              <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Edit Employee</h2>
                    <p className="text-slate-500 mt-1">Update employee reimbursement information</p>
                  </div>
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center"
                  >
                    <X size={22} />
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <label className="text-slate-700 font-medium">Employee Name</label>
                    <input
                      disabled
                      value={selectedEmployee.nama}
                      className="mt-3 w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium">Plafond</label>
                    <input
                      type="number"
                      value={editPlafond}
                      onChange={(e) => setEditPlafond(e.target.value)}
                      className={`${inputStyle} mt-3`}
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium">Remaining Plafond</label>
                    <input
                      type="number"
                      value={editSisaPlafond}
                      onChange={(e) => setEditSisaPlafond(e.target.value)}
                      className={`${inputStyle} mt-3`}
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium">Department</label>
                    <input
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className={`${inputStyle} mt-3`}
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium">Position</label>
                    <input
                      value={editJabatan}
                      onChange={(e) => setEditJabatan(e.target.value)}
                      className={`${inputStyle} mt-3`}
                    />
                  </div>
                  <button
                    onClick={handleSaveEmployee}
                    className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-lg ${primaryButton}`}
                  >
                    <Save size={22} /> Save Employee
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =====================
              CHANGE PASSWORD MODAL
          ===================== */}
          {isPasswordModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Ganti Password</h2>
                    <p className="text-slate-500 mt-1 text-sm">Masukkan password baru Anda</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsPasswordModalOpen(false)
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-8 space-y-5">
                  <div>
                    <label className="text-slate-700 font-medium">Password Baru</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="mt-2 w-full px-5 py-4 rounded-2xl border border-slate-200 outline-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium">Konfirmasi Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="mt-2 w-full px-5 py-4 rounded-2xl border border-slate-200 outline-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={isUpdatingPassword}
                    className="w-full mt-2 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 transition-all text-white font-semibold text-lg shadow-md flex items-center justify-center gap-3 active:scale-95"
                  >
                    {isUpdatingPassword ? (
                      'Menyimpan...'
                    ) : (
                      <>
                        <Save size={20} /> Simpan Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}