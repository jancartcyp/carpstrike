'use client'

import { useTransition } from 'react'
import { deleteTeam } from '@/app/actions/teams'
import styles from '../../../dashboard.module.css'

/**
 * Bouton de suppression autonome (pas un <form> imbriqué) : la liste des équipes est elle-même
 * un grand formulaire (postes/secteurs), et le HTML n'autorise pas les formulaires imbriqués.
 * On invoque donc la server action directement, hors soumission de formulaire.
 */
export function DeleteTeamButton({
  enduroId,
  teamId,
  teamName,
}: {
  enduroId: string
  teamId: string
  teamName: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      className={styles.btnDanger}
      style={{ padding: '6px 12px' }}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Supprimer l’équipe « ${teamName} » ?`)) return
        const fd = new FormData()
        fd.set('enduroId', enduroId)
        fd.set('teamId', teamId)
        startTransition(() => {
          deleteTeam(fd)
        })
      }}
    >
      {pending ? '…' : 'Suppr.'}
    </button>
  )
}
