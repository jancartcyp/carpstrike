'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Rafraîchit le classement en direct :
 * - **instantanément** via Supabase Realtime (canal broadcast `enduro-<id>`), émis côté serveur
 *   à chaque prise saisie / validation modifiée ;
 * - avec un **polling de secours** toutes les 15 s si le realtime est indisponible.
 * Actif uniquement tant que l'enduro est LIVE.
 */
export function LiveRefresh({ active, enduroId }: { active: boolean; enduroId: string }) {
  const router = useRouter()

  useEffect(() => {
    if (!active) return

    const poll = setInterval(() => router.refresh(), 15000)

    const supabase = createClient()
    const channel = supabase
      .channel(`enduro-${enduroId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'update' }, () => router.refresh())
      .subscribe()

    return () => {
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [active, enduroId, router])

  return null
}
