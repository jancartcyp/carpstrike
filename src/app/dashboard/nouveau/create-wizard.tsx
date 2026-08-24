'use client'

import { useActionState, useEffect, useState } from 'react'
import { createEnduro } from '@/app/actions/enduros'
import { PEG_ASSIGNMENTS } from '@/lib/validations/enduro'
import styles from '../dashboard.module.css'

type FormValues = {
  name: string
  description: string
  mode: 'MANAGED_ONLY' | 'WITH_REGISTRATION'
  startAt: string
  endAt: string
  durationHours: string
  locationName: string
  address: string
  postalCode: string
  maxTeams: string
  maxFishersPerTeam: string
  sectorsCount: string
  minWeightKg: string
  pegAssignment: string
  pegAssignmentNote: string
  registrationFee: string
  prizePool: string
  theme: string
  rulesText: string
}

const INITIAL: FormValues = {
  name: '',
  description: '',
  mode: 'WITH_REGISTRATION',
  startAt: '',
  endAt: '',
  durationHours: '48',
  locationName: '',
  address: '',
  postalCode: '',
  maxTeams: '20',
  maxFishersPerTeam: '2',
  sectorsCount: '4',
  minWeightKg: '3',
  pegAssignment: 'PRECISION_THROW',
  pegAssignmentNote: '',
  registrationFee: '0',
  prizePool: '',
  theme: '',
  rulesText: '',
}

const STEPS = [
  'Infos',
  'Dates',
  'Lieu',
  'Équipes',
  'Règles',
  'Inscriptions',
  'Présentation',
  'Récap',
] as const

// Champ → étape (pour sauter à la 1re erreur renvoyée par le serveur).
const FIELD_STEP: Record<string, number> = {
  name: 0,
  description: 0,
  mode: 0,
  startAt: 1,
  endAt: 1,
  durationHours: 1,
  locationName: 2,
  address: 2,
  postalCode: 2,
  maxTeams: 3,
  maxFishersPerTeam: 3,
  sectorsCount: 3,
  minWeightKg: 4,
  pegAssignment: 4,
  pegAssignmentNote: 4,
  registrationFee: 5,
  prizePool: 5,
  theme: 6,
  rulesText: 6,
}

export function CreateWizard() {
  const [state, action, pending] = useActionState(createEnduro, undefined)
  const [step, setStep] = useState(0)
  const [v, setV] = useState<FormValues>(INITIAL)

  const set = (k: keyof FormValues, val: string) => setV((s) => ({ ...s, [k]: val }))
  const err = (k: string) => state?.errors?.[k]?.[0]

  // Les étapes changent sans navigation → on remonte en haut à chaque étape.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [step])

  // En cas d'erreur de validation serveur, sauter à l'étape de la 1re erreur.
  // Pattern « ajustement pendant le rendu » (sans effet) : on réagit au changement
  // de référence de `state` renvoyé par l'action.
  const [seenState, setSeenState] = useState(state)
  if (state !== seenState) {
    setSeenState(state)
    if (state?.errors) {
      const firstField = Object.keys(state.errors)[0]
      const target = firstField !== undefined ? FIELD_STEP[firstField] : undefined
      if (target !== undefined) setStep(target)
    }
  }

  const isLast = step === STEPS.length - 1
  const modeLabel = v.mode === 'WITH_REGISTRATION' ? 'Inscriptions en ligne' : 'Gestion seule'

  return (
    <form action={action}>
      {/* Tous les champs sont montés en permanence : un seul submit les envoie tous. */}
      <div className={styles.stepper}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`${styles.stepDot} ${i < step ? styles.done : ''} ${
              i === step ? styles.current : ''
            }`}
          />
        ))}
      </div>

      <div className={styles.stepCount}>
        Étape {step + 1} / {STEPS.length}
      </div>
      <div className={styles.stepTitle}>{STEPS[step]}</div>

      {state?.message && (
        <div className={`${styles.statusMsg} ${styles.statusError}`}>{state.message}</div>
      )}

      {/* ÉTAPE 1 — INFOS */}
      <div style={{ display: step === 0 ? 'block' : 'none' }}>
        <div className={styles.field}>
          <label htmlFor="name">
            Nom de l’enduro <span className="req">*</span>
          </label>
          <input id="name" name="name" value={v.name} onChange={(e) => set('name', e.target.value)} />
          {err('name') && <p className={styles.fieldError}>{err('name')}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="description">
            Description <span className="optional">facultatif</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={v.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>
            Mode <span className="req">*</span>
          </label>
          <input type="hidden" name="mode" value={v.mode} />
          <div className={styles.choiceGrid}>
            {(
              [
                {
                  val: 'WITH_REGISTRATION',
                  title: 'Avec inscriptions',
                  desc: 'Les pêcheurs s’inscrivent en ligne',
                },
                {
                  val: 'MANAGED_ONLY',
                  title: 'Gestion seule',
                  desc: 'Vous saisissez les équipes manuellement',
                },
              ] as const
            ).map((m) => (
              <button
                key={m.val}
                type="button"
                onClick={() => set('mode', m.val)}
                className={`${styles.choiceCard} ${v.mode === m.val ? styles.active : ''}`}
              >
                <span className={styles.choiceCardTitle}>{m.title}</span>
                <span className={styles.choiceCardDesc}>{m.desc}</span>
              </button>
            ))}
          </div>
          <p className={styles.fieldHelper}>Gratuit pendant le lancement, quel que soit le mode.</p>
        </div>
      </div>

      {/* ÉTAPE 2 — DATES */}
      <div style={{ display: step === 1 ? 'block' : 'none' }}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="startAt">
              Début <span className="req">*</span>
            </label>
            <input
              id="startAt"
              name="startAt"
              type="datetime-local"
              value={v.startAt}
              onChange={(e) => set('startAt', e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
            {err('startAt') && <p className={styles.fieldError}>{err('startAt')}</p>}
          </div>
          <div className={styles.field}>
            <label htmlFor="endAt">
              Fin <span className="req">*</span>
            </label>
            <input
              id="endAt"
              name="endAt"
              type="datetime-local"
              value={v.endAt}
              onChange={(e) => set('endAt', e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
            {err('endAt') && <p className={styles.fieldError}>{err('endAt')}</p>}
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="durationHours">
            Durée (heures) <span className="req">*</span>
          </label>
          <input
            id="durationHours"
            name="durationHours"
            type="number"
            min={1}
            max={240}
            value={v.durationHours}
            onChange={(e) => set('durationHours', e.target.value)}
          />
          {err('durationHours') && <p className={styles.fieldError}>{err('durationHours')}</p>}
        </div>
      </div>

      {/* ÉTAPE 3 — LIEU */}
      <div style={{ display: step === 2 ? 'block' : 'none' }}>
        <div className={styles.field}>
          <label htmlFor="locationName">
            Nom du plan d’eau <span className="req">*</span>
          </label>
          <input
            id="locationName"
            name="locationName"
            value={v.locationName}
            onChange={(e) => set('locationName', e.target.value)}
          />
          {err('locationName') && <p className={styles.fieldError}>{err('locationName')}</p>}
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="address">
              Adresse <span className="optional">facultatif</span>
            </label>
            <input
              id="address"
              name="address"
              value={v.address}
              onChange={(e) => set('address', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="postalCode">
              Code postal <span className="optional">facultatif</span>
            </label>
            <input
              id="postalCode"
              name="postalCode"
              value={v.postalCode}
              onChange={(e) => set('postalCode', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ÉTAPE 4 — ÉQUIPES & SECTEURS */}
      <div style={{ display: step === 3 ? 'block' : 'none' }}>
        <div className={styles.fieldRow3}>
          <div className={styles.field}>
            <label htmlFor="maxTeams">
              Nombre d’équipes <span className="req">*</span>
            </label>
            <input
              id="maxTeams"
              name="maxTeams"
              type="number"
              min={1}
              value={v.maxTeams}
              onChange={(e) => set('maxTeams', e.target.value)}
            />
            {err('maxTeams') && <p className={styles.fieldError}>{err('maxTeams')}</p>}
          </div>
          <div className={styles.field}>
            <label htmlFor="maxFishersPerTeam">Pêcheurs / équipe</label>
            <input
              id="maxFishersPerTeam"
              name="maxFishersPerTeam"
              type="number"
              min={1}
              max={10}
              value={v.maxFishersPerTeam}
              onChange={(e) => set('maxFishersPerTeam', e.target.value)}
            />
            {err('maxFishersPerTeam') && (
              <p className={styles.fieldError}>{err('maxFishersPerTeam')}</p>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="sectorsCount">Secteurs</label>
            <input
              id="sectorsCount"
              name="sectorsCount"
              type="number"
              min={0}
              max={12}
              value={v.sectorsCount}
              onChange={(e) => set('sectorsCount', e.target.value)}
            />
            {err('sectorsCount') && <p className={styles.fieldError}>{err('sectorsCount')}</p>}
          </div>
        </div>
        <p className={styles.fieldHelper}>
          Les secteurs seront créés automatiquement (A, B, C…). Vous pourrez les ajuster ensuite.
        </p>
      </div>

      {/* ÉTAPE 5 — RÈGLES DE PESÉE */}
      <div style={{ display: step === 4 ? 'block' : 'none' }}>
        <div className={styles.field}>
          <label htmlFor="minWeightKg">Maille minimum (kg)</label>
          <input
            id="minWeightKg"
            name="minWeightKg"
            type="number"
            step={0.5}
            min={0}
            value={v.minWeightKg}
            onChange={(e) => set('minWeightKg', e.target.value)}
          />
          {err('minWeightKg') && <p className={styles.fieldError}>{err('minWeightKg')}</p>}
          <p className={styles.fieldHelper}>
            Les prises sous ce poids seront refusées à la saisie.
          </p>
        </div>
        <label
          className={styles.field}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          {/* Décochée par défaut : l'organisateur active la photo obligatoire s'il le souhaite. */}
          <input
            type="checkbox"
            name="requirePhoto"
            style={{ width: 18, height: 18, accentColor: 'var(--red)' }}
          />
          <span style={{ fontSize: '0.9rem', color: 'var(--white)' }}>
            Photo obligatoire à la saisie d’une prise
          </span>
        </label>

        <div className={styles.field} style={{ marginTop: 18 }}>
          <label htmlFor="pegAssignment">Attribution des postes</label>
          <select
            id="pegAssignment"
            name="pegAssignment"
            value={v.pegAssignment}
            onChange={(e) => set('pegAssignment', e.target.value)}
          >
            {PEG_ASSIGNMENTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {err('pegAssignment') && <p className={styles.fieldError}>{err('pegAssignment')}</p>}
          <p className={styles.fieldHelper}>
            {PEG_ASSIGNMENTS.find((p) => p.value === v.pegAssignment)?.hint}
          </p>
        </div>

        {v.pegAssignment === 'OTHER' && (
          <div className={styles.field}>
            <label htmlFor="pegAssignmentNote">Précisez votre méthode</label>
            <textarea
              id="pegAssignmentNote"
              name="pegAssignmentNote"
              rows={3}
              value={v.pegAssignmentNote}
              onChange={(e) => set('pegAssignmentNote', e.target.value)}
              placeholder="Ex. Attribution par ordre d’inscription, postes réservés aux habitués…"
            />
            {err('pegAssignmentNote') && (
              <p className={styles.fieldError}>{err('pegAssignmentNote')}</p>
            )}
          </div>
        )}
      </div>

      {/* ÉTAPE 6 — INSCRIPTIONS */}
      <div style={{ display: step === 5 ? 'block' : 'none' }}>
        <div className={styles.infoBox}>
          💡 Le paiement en ligne est désactivé pendant le lancement gratuit. Le tarif ci-dessous
          est purement indicatif (encaissement à votre charge, hors plateforme).
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="registrationFee">Frais d’inscription / équipe (€)</label>
            <input
              id="registrationFee"
              name="registrationFee"
              type="number"
              min={0}
              step={1}
              value={v.registrationFee}
              onChange={(e) => set('registrationFee', e.target.value)}
            />
            {err('registrationFee') && <p className={styles.fieldError}>{err('registrationFee')}</p>}
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
              step={1}
              value={v.prizePool}
              onChange={(e) => set('prizePool', e.target.value)}
            />
            {err('prizePool') && <p className={styles.fieldError}>{err('prizePool')}</p>}
          </div>
        </div>
      </div>

      {/* ÉTAPE 7 — PRÉSENTATION */}
      <div style={{ display: step === 6 ? 'block' : 'none' }}>
        <div className={styles.field}>
          <label htmlFor="theme">
            Thème de la page publique <span className="optional">facultatif</span>
          </label>
          <select id="theme" name="theme" value={v.theme} onChange={(e) => set('theme', e.target.value)}>
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
            style={{ minHeight: 140 }}
            value={v.rulesText}
            onChange={(e) => set('rulesText', e.target.value)}
          />
        </div>
      </div>

      {/* ÉTAPE 8 — RÉCAP */}
      <div style={{ display: step === 7 ? 'block' : 'none' }}>
        <div className={styles.recapGrid}>
          <div className={styles.recapItem}>
            <div className={styles.recapLabel}>Nom</div>
            <div className={styles.recapValue}>{v.name || '—'}</div>
          </div>
          <div className={styles.recapItem}>
            <div className={styles.recapLabel}>Mode</div>
            <div className={styles.recapValue}>{modeLabel}</div>
          </div>
          <div className={styles.recapItem}>
            <div className={styles.recapLabel}>Dates</div>
            <div className={styles.recapValue}>
              {v.startAt ? v.startAt.replace('T', ' ') : '—'} → {v.endAt ? v.endAt.replace('T', ' ') : '—'}
            </div>
          </div>
          <div className={styles.recapItem}>
            <div className={styles.recapLabel}>Lieu</div>
            <div className={styles.recapValue}>{v.locationName || '—'}</div>
          </div>
          <div className={styles.recapItem}>
            <div className={styles.recapLabel}>Équipes / secteurs</div>
            <div className={styles.recapValue}>
              {v.maxTeams} équipes · {v.sectorsCount} secteurs
            </div>
          </div>
          <div className={styles.recapItem}>
            <div className={styles.recapLabel}>Frais d’inscription</div>
            <div className={styles.recapValue}>
              {Number(v.registrationFee) > 0 ? `${v.registrationFee} €` : 'Gratuit'}
            </div>
          </div>
        </div>
        <p className={styles.fieldHelper} style={{ marginTop: 14 }}>
          L’enduro sera créé en <strong>brouillon</strong>. Vous pourrez le compléter puis le publier.
        </p>
      </div>

      {/* NAVIGATION */}
      <div className={styles.wizardNav}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
        >
          ← Précédent
        </button>

        {isLast ? (
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Création…' : 'Créer l’enduro'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          >
            Suivant →
          </button>
        )}
      </div>
    </form>
  )
}
