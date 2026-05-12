'use client'

import { useState }
from 'react'

import { useRouter }
from 'next/navigation'

import {
  ArrowLeft,
  Upload,
  Receipt,
} from 'lucide-react'

import toast
from 'react-hot-toast'

import { v4 as uuidv4 }
from 'uuid'

import {
  supabase
} from '@/lib/supabase'

import {
  getUser
} from '@/lib/auth'

export default function SubmitPage() {

  const router = useRouter()

  const user = getUser()

  const [loading, setLoading] =
    useState(false)

  const [jenisClaim,
    setJenisClaim] =
    useState('')

  const [nominal,
    setNominal] =
    useState('')

  const [tanggalPengobatan,
    setTanggalPengobatan] =
    useState('')

  const [catatan,
    setCatatan] =
    useState('')

  const [file,
    setFile] =
    useState<File | null>(null)

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault()

    if (!file) {

      toast.error(
        'Upload bukti kuitansi'
      )

      return
    }

    setLoading(true)

    try {

      /* =========================
         UPLOAD FILE
      ========================= */

      const fileExt =
        file.name.split('.').pop()

      const fileName =
        `${uuidv4()}.${fileExt}`

      const {
        error: uploadError
      } = await supabase.storage
        .from('reimbursement-files')
        .upload(fileName, file)

      if (uploadError) {

        console.error(uploadError)

        toast.error(
          'Gagal upload file'
        )

        setLoading(false)

        return
      }

      /* =========================
         GET PUBLIC URL
      ========================= */

      const {
        data: publicUrlData
      } = supabase.storage
        .from('reimbursement-files')
        .getPublicUrl(fileName)

      const fileUrl =
        publicUrlData.publicUrl

      /* =========================
         INSERT DATABASE
      ========================= */

      const {
        error: insertError
      } = await supabase
        .from('reimbursements')
        .insert({

          nama:
            user.nama,

          departemen:
            'employee',

          jenis_claim:
            jenisClaim,

          nominal:
            nominal,

          tanggal_pengobatan:
            tanggalPengobatan,

          catatan:
            catatan,

          status:
            'pending_hr',

          claim_number:
            `CLM-${Date.now()}`,

          approved_by_hr:
            null,

          approved_by_finance:
            null,

          nomor_wa:
            user.nomor_wa || '',

          bukti_bayar:
            null,

          bukti_kuitansi:
            fileUrl,

        })

      if (insertError) {

        console.error(insertError)

        toast.error(
          'Gagal simpan database'
        )

        setLoading(false)

        return
      }

      toast.success(
        'Reimbursement berhasil dikirim'
      )

      setTimeout(() => {

        router.push('/employee')

      }, 1500)

    } catch (error) {

      console.error(error)

      toast.error(
        'Terjadi kesalahan'
      )

    } finally {

      setLoading(false)

    }
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">

        <div className="flex items-center gap-4">

          <button
            onClick={() =>
              router.push('/employee')
            }
            className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center"
          >

            <ArrowLeft size={22} />

          </button>

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Submit Reimbursement
            </h1>

            <p className="text-slate-500">
              Upload reimbursement data
            </p>

          </div>

        </div>

      </header>

      {/* CONTENT */}
      <main className="p-8 flex justify-center">

        <div className="w-full max-w-3xl bg-white rounded-[32px] shadow-sm border border-slate-200 p-10">

          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >

            {/* JENIS CLAIM */}
            <div>

              <label className="text-lg font-semibold text-slate-800">
                Jenis Claim
              </label>

              <input
                type="text"
                value={jenisClaim}
                onChange={(e) =>
                  setJenisClaim(
                    e.target.value
                  )
                }
                placeholder="Contoh: Rawat Jalan"
                className="mt-3 w-full rounded-2xl border border-slate-200 px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* NOMINAL */}
            <div>

              <label className="text-lg font-semibold text-slate-800">
                Nominal
              </label>

              <input
                type="number"
                value={nominal}
                onChange={(e) =>
                  setNominal(
                    e.target.value
                  )
                }
                placeholder="Contoh: 500000"
                className="mt-3 w-full rounded-2xl border border-slate-200 px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* TANGGAL */}
            <div>

              <label className="text-lg font-semibold text-slate-800">
                Tanggal Pengobatan
              </label>

              <input
                type="date"
                value={tanggalPengobatan}
                onChange={(e) =>
                  setTanggalPengobatan(
                    e.target.value
                  )
                }
                className="mt-3 w-full rounded-2xl border border-slate-200 px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* CATATAN */}
            <div>

              <label className="text-lg font-semibold text-slate-800">
                Catatan
              </label>

              <textarea
                rows={5}
                value={catatan}
                onChange={(e) =>
                  setCatatan(
                    e.target.value
                  )
                }
                placeholder="Masukkan detail reimbursement"
                className="mt-3 w-full rounded-2xl border border-slate-200 px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

            </div>

            {/* FILE */}
            <div>

              <label className="text-lg font-semibold text-slate-800">
                Upload Bukti Kuitansi
              </label>

              <label className="mt-3 border-2 border-dashed border-slate-300 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 transition-all">

                <Upload
                  className="text-blue-500 mb-4"
                  size={40}
                />

                <h3 className="text-xl font-semibold text-slate-800">
                  Upload File
                </h3>

                <p className="text-slate-500 mt-2">
                  PNG, JPG, JPEG, PDF
                </p>

                {
                  file && (

                    <div className="mt-5 flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-50 text-blue-700">

                      <Receipt size={20} />

                      {file.name}

                    </div>

                  )
                }

                <input
                  type="file"
                  hidden
                  onChange={(e) => {

                    if (
                      e.target.files &&
                      e.target.files[0]
                    ) {

                      setFile(
                        e.target.files[0]
                      )
                    }

                  }}
                />

              </label>

            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-all text-white text-xl font-bold shadow-lg disabled:opacity-70"
            >

              {
                loading
                  ? 'Submitting...'
                  : 'Submit Reimbursement'
              }

            </button>

          </form>

        </div>

      </main>

    </div>
  )
}