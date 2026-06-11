'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Rafraîchit la page toutes les 10 s tant que l'enduro est en direct (polling). */
export function LiveRefresh({ active }: { active: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => router.refresh(), 10000)
    return () => clearInterval(id)
  }, [active, router])

  return null
}
