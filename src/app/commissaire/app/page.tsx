import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCommissaireContext } from '@/lib/commissaire/dal'
import { catchWindow } from '@/lib/enduro-status'
import { CommissaireApp } from './commissaire-app'

export const metadata: Metadata = {
  title: 'App commissaire — CarpStrike',
}

const SPECIES: Record<string, string> = {
  COMMUNE: 'Commune',
  MIROIR: 'Miroir',
  CUIR: 'Cuir',
  KOI: 'Koï',
  AMOUR_BLANC: 'Amour blanc',
}
const whenFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default async function CommissaireAppPage() {
  const ctx = await getCommissaireContext()
  if (!ctx) redirect('/commissaire')

  const { commissaire, teams, recentCatches, validCount } = ctx
  // Saisie fermée hors période (pas commencé / terminé / clôturé) — l'UI le signale,
  // et `submitCatch` refuse de toute façon côté serveur.
  const window = catchWindow(commissaire.enduro)

  return (
    <CommissaireApp
      commissaireName={commissaire.displayName}
      enduroName={commissaire.enduro.name}
      minWeightKg={commissaire.enduro.minWeightKg}
      requirePhoto={commissaire.enduro.requirePhoto}
      closedReason={window.open ? null : (window.reason ?? null)}
      validCount={validCount}
      teams={teams.map((t) => ({
        id: t.id,
        name: t.name,
        pegNumber: t.pegNumber,
        sectorName: t.sector?.name ?? null,
        catches: t._count.catches,
      }))}
      recent={recentCatches.map((c) => ({
        teamName: c.team.name,
        weightKg: c.weightKg,
        species: SPECIES[c.species] ?? c.species,
        status: c.status,
        when: whenFmt.format(c.caughtAt),
      }))}
    />
  )
}
