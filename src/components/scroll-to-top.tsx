'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Garantit que chaque changement de page (ré)affiche le haut de la page.
 * Garde-fou en complément du comportement par défaut du App Router.
 */
export function ScrollToTop() {
  const pathname = usePathname()

  // Désactive la restauration de scroll du navigateur (sinon il replace la page
  // à l'ancienne position après la navigation).
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // À chaque changement de page, remonte en haut — différé après la peinture
  // pour l'emporter sur toute repositionnement tardif.
  useEffect(() => {
    const id = requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }))
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return null
}
