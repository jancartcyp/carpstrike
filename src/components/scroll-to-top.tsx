'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Garantit que chaque changement de page (ré)affiche le haut de la page.
 * Garde-fou en complément du comportement par défaut du App Router.
 */
export function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
