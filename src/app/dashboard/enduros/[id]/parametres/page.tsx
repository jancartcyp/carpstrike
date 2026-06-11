import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { getOrganizerEnduro } from '@/lib/organizer'
import { isStructurallyLocked } from '@/lib/validations/enduro'
import styles from '../../../dashboard.module.css'
import { DangerZone } from './danger-zone'
import { SectionForm } from './section-form'

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const centsToEuros = (cents: number | null) => (cents && cents > 0 ? Math.round(cents / 100) : 0)

const LOCK_NOTE = 'L’enduro est en cours ou terminé : ce paramètre est verrouillé.'

export default async function ParametresPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ delete?: string }>
}) {
  const { id } = await params
  const { delete: deleteFlag } = await searchParams
  const user = await requireRole('ORGANIZER')
  const enduro = await getOrganizerEnduro(id, user.id)
  if (!enduro) notFound()

  const locked = isStructurallyLocked(enduro.status)

  return (
    <>
      {enduro.status === 'LIVE' && (
        <div className={`${styles.infoBox} ${styles.warn}`} style={{ marginBottom: 22 }}>
          <span>
            <strong>Enduro en cours · édition limitée.</strong> Les dates, le nombre d’équipes et les
            tarifs ne sont plus modifiables. Vous pouvez toujours éditer les infos, le lieu, les
            règles de pesée et la présentation.
          </span>
        </div>
      )}

      {deleteFlag === 'mismatch' && (
        <div className={`${styles.statusMsg} ${styles.statusError}`}>
          Le nom saisi ne correspond pas. Suppression annulée.
        </div>
      )}

      {/* 1 — Infos générales */}
      <SectionForm
        enduroId={enduro.id}
        section="infos"
        num={1}
        title="Informations générales"
        subtitle="Nom et description de l’enduro"
      >
        <div className={styles.field}>
          <label htmlFor="name">
            Nom <span className="req">*</span>
          </label>
          <input id="name" name="name" defaultValue={enduro.name} />
        </div>
        <div className={styles.field}>
          <label htmlFor="description">
            Description <span className="optional">facultatif</span>
          </label>
          <textarea id="description" name="description" defaultValue={enduro.description ?? ''} />
        </div>
      </SectionForm>

      {/* 2 — Dates */}
      <SectionForm
        enduroId={enduro.id}
        section="dates"
        num={2}
        title="Dates & durée"
        subtitle="Calendrier de la compétition"
        locked={locked}
        lockedNote={LOCK_NOTE}
      >
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="startAt">Début</label>
            <input
              id="startAt"
              name="startAt"
              type="datetime-local"
              defaultValue={toLocalInput(enduro.startAt)}
              disabled={locked}
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="endAt">Fin</label>
            <input
              id="endAt"
              name="endAt"
              type="datetime-local"
              defaultValue={toLocalInput(enduro.endAt)}
              disabled={locked}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="durationHours">Durée (heures)</label>
          <input
            id="durationHours"
            name="durationHours"
            type="number"
            min={1}
            max={240}
            defaultValue={enduro.durationHours}
            disabled={locked}
          />
        </div>
      </SectionForm>

      {/* 3 — Lieu */}
      <SectionForm
        enduroId={enduro.id}
        section="lieu"
        num={3}
        title="Lieu"
        subtitle="Plan d’eau et adresse"
      >
        <div className={styles.field}>
          <label htmlFor="locationName">
            Nom du plan d’eau <span className="req">*</span>
          </label>
          <input id="locationName" name="locationName" defaultValue={enduro.locationName} />
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="address">
              Adresse <span className="optional">facultatif</span>
            </label>
            <input id="address" name="address" defaultValue={enduro.address ?? ''} />
          </div>
          <div className={styles.field}>
            <label htmlFor="postalCode">
              Code postal <span className="optional">facultatif</span>
            </label>
            <input id="postalCode" name="postalCode" defaultValue={enduro.postalCode ?? ''} />
          </div>
        </div>
      </SectionForm>

      {/* 4 — Équipes */}
      <SectionForm
        enduroId={enduro.id}
        section="equipes"
        num={4}
        title="Équipes"
        subtitle="Configuration de la compétition"
        locked={locked}
        lockedNote={LOCK_NOTE}
      >
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="maxTeams">Nombre d’équipes</label>
            <input
              id="maxTeams"
              name="maxTeams"
              type="number"
              min={1}
              defaultValue={enduro.maxTeams}
              disabled={locked}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="maxFishersPerTeam">Pêcheurs / équipe</label>
            <input
              id="maxFishersPerTeam"
              name="maxFishersPerTeam"
              type="number"
              min={1}
              max={10}
              defaultValue={enduro.maxFishersPerTeam}
              disabled={locked}
            />
          </div>
        </div>
        <p className={styles.fieldHelper}>
          La gestion fine des secteurs se fait dans l’onglet « Secteurs ».
        </p>
      </SectionForm>

      {/* 5 — Règles de pesée */}
      <SectionForm
        enduroId={enduro.id}
        section="regles"
        num={5}
        title="Règles de pesée"
        subtitle="Maille minimum"
      >
        <div className={styles.field}>
          <label htmlFor="minWeightKg">Maille minimum (kg)</label>
          <input
            id="minWeightKg"
            name="minWeightKg"
            type="number"
            step={0.5}
            min={0}
            defaultValue={enduro.minWeightKg}
          />
          <p className={styles.fieldHelper}>
            Les prises sous ce poids sont refusées à la saisie.
          </p>
        </div>
        <label
          className={styles.field}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <input
            type="checkbox"
            name="requirePhoto"
            defaultChecked={enduro.requirePhoto}
            style={{ width: 18, height: 18, accentColor: 'var(--red)' }}
          />
          <span style={{ fontSize: '0.9rem', color: 'var(--white)' }}>
            Photo obligatoire pour valider une prise
          </span>
        </label>
      </SectionForm>

      {/* 6 — Inscriptions */}
      <SectionForm
        enduroId={enduro.id}
        section="inscriptions"
        num={6}
        title="Inscriptions"
        subtitle="Tarif et dotation"
        locked={locked}
        lockedNote={LOCK_NOTE}
      >
        <div className={styles.infoBox}>
          💡 Paiement en ligne désactivé pendant le lancement gratuit. Le tarif est indicatif.
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="registrationFee">Frais d’inscription / équipe (€)</label>
            <input
              id="registrationFee"
              name="registrationFee"
              type="number"
              min={0}
              defaultValue={centsToEuros(enduro.registrationFee)}
              disabled={locked}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="prizePool">
              Dotation totale (€) <span className="optional">facultatif</span>
            </label>
            <input
              id="prizePool"
              name="prizePool"
              type="number"
              min={0}
              defaultValue={enduro.prizePool ? centsToEuros(enduro.prizePool) : ''}
              disabled={locked}
            />
          </div>
        </div>
      </SectionForm>

      {/* 7 — Présentation */}
      <SectionForm
        enduroId={enduro.id}
        section="presentation"
        num={7}
        title="Présentation"
        subtitle="Thème et règlement"
      >
        <div className={styles.field}>
          <label htmlFor="theme">
            Thème <span className="optional">facultatif</span>
          </label>
          <select id="theme" name="theme" defaultValue={enduro.theme ?? ''}>
            <option value="">Par défaut</option>
            <option value="Lac Bleu">Lac Bleu</option>
            <option value="Forêt">Forêt</option>
            <option value="Sunset">Sunset</option>
            <option value="Nuit">Nuit</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="rulesText">
            Règlement <span className="optional">facultatif</span>
          </label>
          <textarea
            id="rulesText"
            name="rulesText"
            style={{ minHeight: 160 }}
            defaultValue={enduro.rulesText ?? ''}
          />
        </div>
      </SectionForm>

      <DangerZone enduroId={enduro.id} enduroName={enduro.name} status={enduro.status} />
    </>
  )
}
