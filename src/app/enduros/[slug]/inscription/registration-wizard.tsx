'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { submitRegistration } from '@/app/actions/registrations'
import styles from './inscription.module.css'

const STEPS = ['Équipe', 'Pêcheurs', 'Règlement', 'Confirmation']

const FIELD_STEP: Record<string, number> = {
  teamName: 0,
  comment: 0,
  members: 1,
  acceptRules: 2,
}

export function RegistrationWizard({
  enduroId,
  enduroSlug,
  rulesText,
}: {
  enduroId: string
  enduroSlug: string
  rulesText: string | null
}) {
  const [state, action, pending] = useActionState(submitRegistration, undefined)
  const [step, setStep] = useState(0)

  // Ajustement pendant le rendu (sans effet) : succès → confirmation ; erreur → étape concernée.
  const [seen, setSeen] = useState(state)
  if (state !== seen) {
    setSeen(state)
    if (state?.ok) {
      setStep(3)
    } else if (state?.errors) {
      const first = Object.keys(state.errors)[0]
      const target = first !== undefined ? FIELD_STEP[first] : undefined
      if (target !== undefined) setStep(target)
    }
  }

  const err = (k: string) => state?.errors?.[k]?.[0]

  return (
    <form action={action} className={styles.formMain}>
      <input type="hidden" name="enduroId" value={enduroId} />

      <div className={styles.stepBar}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: 'contents' }}>
            <div
              className={`${styles.step} ${i === step ? styles.active : ''} ${
                i < step ? styles.done : ''
              }`}
            >
              <span className={styles.stepNum}>{i < step ? '✓' : i + 1}</span>
              {label}
            </div>
            {i < STEPS.length - 1 && <span className={styles.stepLine} />}
          </div>
        ))}
      </div>

      {state?.message && <div className={styles.statusMsg}>{state.message}</div>}

      {/* ÉTAPE 1 — ÉQUIPE */}
      <div style={{ display: step === 0 ? 'block' : 'none' }}>
        <div className={styles.formEyebrow}>Étape 1 sur 3</div>
        <h2 className={styles.formTitle}>
          Votre <span className="accent">équipe</span>
        </h2>
        <p className={styles.formSub}>Donnez un nom à votre binôme.</p>

        <div className={styles.field}>
          <label htmlFor="teamName">
            Nom de l’équipe <span className="req">*</span>
          </label>
          <input id="teamName" name="teamName" placeholder="Ex. Les Pêcheurs du Dimanche" />
          {err('teamName') && <p className={styles.fieldError}>{err('teamName')}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="comment">
            Commentaire pour l’organisateur <span className="optional">facultatif</span>
          </label>
          <textarea id="comment" name="comment" style={{ minHeight: 70 }} />
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn btn-primary grow" onClick={() => setStep(1)}>
            Continuer →
          </button>
        </div>
      </div>

      {/* ÉTAPE 2 — PÊCHEURS */}
      <div style={{ display: step === 1 ? 'block' : 'none' }}>
        <div className={styles.formEyebrow}>Étape 2 sur 3</div>
        <h2 className={styles.formTitle}>
          Les <span className="accent">pêcheurs</span>
        </h2>
        <p className={styles.formSub}>Le capitaine est le référent de l’équipe.</p>

        {err('members') && <p className={styles.fieldError}>{err('members')}</p>}

        <div className={`${styles.block} ${styles.captain}`}>
          <div className={styles.blockTitle}>Capitaine</div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="m0_firstName">
                Prénom <span className="req">*</span>
              </label>
              <input id="m0_firstName" name="m0_firstName" />
            </div>
            <div className={styles.field}>
              <label htmlFor="m0_lastName">
                Nom <span className="req">*</span>
              </label>
              <input id="m0_lastName" name="m0_lastName" />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="m0_email">
                Email <span className="optional">facultatif</span>
              </label>
              <input id="m0_email" name="m0_email" type="email" />
            </div>
            <div className={styles.field}>
              <label htmlFor="m0_phone">
                Téléphone <span className="optional">facultatif</span>
              </label>
              <input id="m0_phone" name="m0_phone" type="tel" />
            </div>
          </div>
        </div>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Co-équipier (facultatif)</div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="m1_firstName">Prénom</label>
              <input id="m1_firstName" name="m1_firstName" />
            </div>
            <div className={styles.field}>
              <label htmlFor="m1_lastName">Nom</label>
              <input id="m1_lastName" name="m1_lastName" />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="m1_email">Email</label>
              <input id="m1_email" name="m1_email" type="email" />
            </div>
            <div className={styles.field}>
              <label htmlFor="m1_phone">Téléphone</label>
              <input id="m1_phone" name="m1_phone" type="tel" />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
            ← Retour
          </button>
          <button type="button" className="btn btn-primary grow" onClick={() => setStep(2)}>
            Continuer →
          </button>
        </div>
      </div>

      {/* ÉTAPE 3 — RÈGLEMENT */}
      <div style={{ display: step === 2 ? 'block' : 'none' }}>
        <div className={styles.formEyebrow}>Étape 3 sur 3</div>
        <h2 className={styles.formTitle}>
          Règlement &amp; <span className="accent">consentement</span>
        </h2>
        <p className={styles.formSub}>Lisez le règlement et acceptez pour envoyer votre demande.</p>

        <div className={styles.reglementBox}>
          {rulesText && rulesText.trim().length > 0
            ? rulesText
            : 'Le règlement détaillé sera communiqué par l’organisateur. En vous inscrivant, vous vous engagez à respecter les règles de la compétition (équipe de pêcheurs majeurs, pesée par commissaire, remise à l’eau des prises).'}
        </div>

        <label className={styles.checkLine}>
          <input type="checkbox" name="acceptRules" />
          <span className={styles.checkText}>
            <strong>J’ai lu et j’accepte le règlement</strong> de l’enduro.
          </span>
        </label>
        {err('acceptRules') && <p className={styles.fieldError}>{err('acceptRules')}</p>}

        <div className={styles.actions}>
          <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
            ← Retour
          </button>
          <button type="submit" className="btn btn-primary grow" disabled={pending}>
            {pending ? 'Envoi…' : '📨 Envoyer ma demande'}
          </button>
        </div>
      </div>

      {/* ÉTAPE 4 — CONFIRMATION */}
      <div style={{ display: step === 3 ? 'block' : 'none' }}>
        <div className={styles.confirmation}>
          <div className={styles.confirmationIcon}>⏳</div>
          <h2 className={styles.confirmationTitle}>
            Demande <span className="accent">envoyée</span> !
          </h2>
          <p className={styles.confirmationDesc}>
            Votre demande a bien été transmise à l’organisateur. Il l’examinera et confirmera votre
            équipe. (Inscription gratuite pendant le lancement — aucun paiement en ligne requis.)
          </p>
          <div className={styles.actions} style={{ justifyContent: 'center', borderTop: 'none' }}>
            <Link href={`/enduros/${enduroSlug}`} className="btn btn-ghost">
              Retour à l’enduro
            </Link>
            <Link href="/enduros" className="btn btn-primary">
              Voir d’autres enduros
            </Link>
          </div>
        </div>
      </div>
    </form>
  )
}
