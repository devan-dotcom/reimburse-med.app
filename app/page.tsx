'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {

  useEffect(() => {
    getUsers()
  }, [])

  async function getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')

    console.log('DATA:', data)
    console.log('ERROR:', error)
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Medical Reimbursement App
      </h1>
    </div>
  )
}