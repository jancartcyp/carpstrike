'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { logoutCommissaire } from '@/app/actions/commissaire-auth'
import { createCatchPhotoUpload, submitCatch } from '@/app/actions/catches'
import { createClient } from '@/lib/supabase/client'
import styles from '../commissaire.module.css'

const CATCHES_BUCKET = 'catches'
const MAX_PHOTO_BYTES = 8 * 1024 * 1024 // 8 Mo

type Team = {
  id: string
  name: string
  pegNumber: number | null
  sectorName: string | null
  catches: number
}
type Recent = { teamName: string; weightKg: number; species: string; status: string; when: string }

const SPECIES = [
  { value: 'COMMUNE', label: 'Commune' },
  { value: 'MIROIR', label: 'Miroir' },
  { value: 'CUIR', label: 'Cuir' },
  { value: 'KOI', label: 'Koï' },
  { value: 'AMOUR_BLANC', label: 'Amour blanc' },
] as const

type Screen = 'home' | 'teams' | 'catch' | 'success' | 'history'

export function CommissaireApp({
  commissaireName,
  enduroName,
  minWeightKg,
  requirePhoto,
  teams,
  recent,
  validCount,
  closedReason,
}: {
  commissaireName: string
  enduroName: string
  minWeightKg: number
  requirePhoto: boolean
  teams: Team[]
  recent: Recent[]
  validCount: number
  /** Non nul si la saisie est fermée (enduro pas commencé, terminé ou clôturé). */
  closedReason?: string | null
}) {
  const [screen, setScreen] = useState<Screen>('home')
  const [team, setTeam] = useState<Team | null>(null)
  const [query, setQuery] = useState('')
  const [weight, setWeight] = useState('')
  const [species, setSpecies] = useState<string>('COMMUNE')
  const [photoName, setPhotoName] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [state, action, pending] = useActionState(submitCatch, undefined)
  const [, startTransition] = useTransition()

  // Upload de la photo côté navigateur (URL signée) puis envoi de l'URL à la Server Action.
  async function handleCatchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploadError('')
    const fd = new FormData(e.currentTarget)
    fd.delete('photo')

    if (photoFile) {
      if (!photoFile.type.startsWith('image/')) {
        setUploadError('Le fichier doit être une image.')
        return
      }
      if (photoFile.size > MAX_PHOTO_BYTES) {
        setUploadError('Photo trop volumineuse (8 Mo maximum).')
        return
      }
      setUploading(true)
      try {
        const prep = await createCatchPhotoUpload()
        if (!prep.ok) {
          setUploadError(prep.message)
          return
        }
        const supabase = createClient()
        const { error } = await supabase.storage
          .from(CATCHES_BUCKET)
          .uploadToSignedUrl(prep.path, prep.token, photoFile, { contentType: photoFile.type })
        if (error) {
          setUploadError("Échec de l'envoi de la photo. Réessayez.")
          return
        }
        const publicUrl = supabase.storage.from(CATCHES_BUCKET).getPublicUrl(prep.path).data.publicUrl
        fd.set('photoUrl', publicUrl)
      } catch {
        setUploadError("Échec de l'envoi de la photo. Réessayez.")
        return
      } finally {
        setUploading(false)
      }
    }

    startTransition(() => action(fd))
  }

  // Succès → écran de confirmation (ajustement pendant le rendu, sans effet).
  const [seen, setSeen] = useState(state)
  if (state !== seen) {
    setSeen(state)
    if (state?.ok) setScreen('success')
  }

  // Les écrans changent sans navigation → on remonte en haut à chaque écran.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [screen])

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      String(t.pegNumber ?? '').includes(query)
  )
  const weightNum = parseFloat(weight)
  const under = !Number.isNaN(weightNum) && weightNum > 0 && weightNum < minWeightKg

  function reset() {
    setWeight('')
    setSpecies('COMMUNE')
    setPhotoName('')
    setPhotoFile(null)
    setUploadError('')
    setTeam(null)
  }

  return (
    <div className={styles.phone}>
      {/* Status bar */}
      <div className={styles.statusBar}>
        <span className={styles.statusInfo}>
          <span className={styles.statusDot} />
          {enduroName}
        </span>
        <form action={logoutCommissaire}>
          <button type="submit" className={styles.topLogout}>
            Quitter
          </button>
        </form>
      </div>

      {/* HOME */}
      {screen === 'home' && (
        <>
          <div className={styles.homeHeader}>
            <div className={styles.homeGreet}>Bonjour,</div>
            <h2 className={styles.homeName}>{commissaireName}</h2>
            <div className={styles.homeTag}>📍 {enduroName}</div>
          </div>
          <div className={styles.quickStats}>
            <div className={styles.quickStat}>
              <div className={`${styles.quickStatVal} ${styles.accent}`}>{validCount}</div>
              <div className={styles.quickStatLbl}>Validées</div>
            </div>
            <div className={styles.quickStat}>
              <div className={styles.quickStatVal}>{teams.length}</div>
              <div className={styles.quickStatLbl}>Équipes</div>
            </div>
            <div className={styles.quickStat}>
              <div className={styles.quickStatVal}>{minWeightKg}</div>
              <div className={styles.quickStatLbl}>Maille kg</div>
            </div>
          </div>
          {closedReason ? (
            <div
              style={{
                margin: '0 18px',
                padding: '16px 18px',
                borderRadius: 12,
                border: '1px solid var(--line-bright)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--dim)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
              }}
            >
              🔒 <strong style={{ color: 'var(--white)' }}>Saisie fermée</strong>
              <br />
              {closedReason}
            </div>
          ) : (
            <button type="button" className={styles.ctaMain} onClick={() => setScreen('teams')}>
              <div className={styles.ctaMainEyebrow}>Action principale</div>
              <div className={styles.ctaMainTitle}>Enregistrer une prise</div>
              <div className={styles.ctaMainSub}>Sélectionner une équipe →</div>
            </button>
          )}
        </>
      )}

      {/* TEAM SELECTION */}
      {screen === 'teams' && (
        <>
          <div className={styles.screenHead}>
            <button type="button" className={styles.backBtn} onClick={() => setScreen('home')}>
              ←
            </button>
            <div className={styles.screenTitle}>Sélectionner l’équipe</div>
          </div>
          {closedReason && (
            <p style={{ padding: '20px 18px', color: 'var(--dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              🔒 <strong style={{ color: 'var(--white)' }}>Saisie fermée</strong>
              <br />
              {closedReason}
            </p>
          )}
          <div className={styles.searchBar} style={closedReason ? { display: 'none' } : undefined}>
            <input
              placeholder="Rechercher équipe ou poste…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {closedReason ? null : filtered.length === 0 ? (
            <p style={{ padding: '24px 18px', color: 'var(--dim)' }}>Aucune équipe confirmée.</p>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                className={styles.teamCard}
                onClick={() => {
                  setTeam(t)
                  setScreen('catch')
                }}
              >
                <span className={styles.teamCardPoste}>{t.pegNumber ?? '—'}</span>
                <span style={{ flex: 1 }}>
                  <span className={styles.teamCardName}>{t.name}</span>
                  <span className={styles.teamCardMeta}>
                    {t.sectorName ? `Secteur ${t.sectorName}` : 'Sans secteur'} · {t.catches} prise
                    {t.catches > 1 ? 's' : ''}
                  </span>
                </span>
              </button>
            ))
          )}
        </>
      )}

      {/* CATCH FORM */}
      {screen === 'catch' && team && (
        <>
          <div className={styles.screenHead}>
            <button type="button" className={styles.backBtn} onClick={() => setScreen('teams')}>
              ←
            </button>
            <div className={styles.screenTitle}>Saisir la prise</div>
          </div>
          <form onSubmit={handleCatchSubmit} className={styles.catchForm}>
            <input type="hidden" name="teamId" value={team.id} />
            <input type="hidden" name="species" value={species} />

            <div className={styles.selectedTeam}>
              <div className={styles.selectedTeamName}>{team.name}</div>
              <div className={styles.selectedTeamMeta}>
                {team.sectorName ? `Secteur ${team.sectorName}` : 'Sans secteur'}
                {team.pegNumber ? ` · Poste ${team.pegNumber}` : ''}
              </div>
            </div>

            {state?.message && <div className={styles.statusMsg}>{state.message}</div>}
            {uploadError && <div className={styles.statusMsg}>{uploadError}</div>}

            <div className={styles.weightCard}>
              <div className={styles.weightLabel}>Poids de la prise</div>
              <div className={styles.weightInputWrap}>
                <input
                  name="weightKg"
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <span className={styles.weightUnit}>kg</span>
              </div>
              <div className={`${styles.weightHelper} ${under ? styles.under : ''}`}>
                {under
                  ? `Sous la maille (${minWeightKg} kg) — sera refusée`
                  : `Minimum ${minWeightKg} kg pour être comptabilisé`}
              </div>
              <div className={styles.quickWeights}>
                {[5, 7.5, 10, 12.5].map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={styles.quickWeight}
                    onClick={() => setWeight(String(w))}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>Espèce</label>
              <div className={styles.speciesRow}>
                {SPECIES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`${styles.speciesPill} ${species === s.value ? styles.active : ''}`}
                    onClick={() => setSpecies(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>
                Photo de la prise {requirePhoto && <span style={{ color: 'var(--red)' }}>*</span>}
              </label>
              <div className={styles.photoUpload}>
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null
                    setPhotoFile(f)
                    setPhotoName(f?.name ?? '')
                    setUploadError('')
                  }}
                />
                <div className={styles.photoIcon}>📷</div>
                <div className={styles.photoTitle}>
                  {photoName ? 'Photo sélectionnée' : 'Prendre / choisir la photo'}
                </div>
                <div className={styles.photoSub}>Tapis humidifié, poisson visible</div>
                {photoName && <div className={styles.photoName}>{photoName}</div>}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="note">Commentaire (facultatif)</label>
              <textarea id="note" name="note" rows={2} />
            </div>

            <div className={styles.submitActions}>
              <button type="submit" className="btn btn-primary" disabled={pending || uploading}>
                {uploading ? 'Envoi de la photo…' : pending ? 'Enregistrement…' : '✓ Valider la prise'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setScreen('teams')}>
                Annuler
              </button>
            </div>
          </form>
        </>
      )}

      {/* SUCCESS */}
      {screen === 'success' && (
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>
            Prise <span className="accent" style={{ color: 'var(--green)' }}>validée</span> !
          </h2>
          <p className={styles.successDesc}>
            La prise a été enregistrée et compte au classement de l’enduro.
          </p>
          <div className={styles.submitActions} style={{ borderTop: 'none' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                reset()
                setScreen('teams')
              }}
            >
              + Nouvelle prise
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                reset()
                setScreen('home')
              }}
            >
              Retour à l’accueil
            </button>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {screen === 'history' && (
        <>
          <div className={styles.screenHead}>
            <button type="button" className={styles.backBtn} onClick={() => setScreen('home')}>
              ←
            </button>
            <div className={styles.screenTitle}>Mon historique</div>
          </div>
          {recent.length === 0 ? (
            <p style={{ padding: '24px 18px', color: 'var(--dim)' }}>Aucune prise saisie.</p>
          ) : (
            recent.map((r, i) => (
              <div key={i} className={styles.historyItem}>
                <span className={`${styles.historyIcon} ${r.status === 'VALID' ? styles.valid : styles.other}`}>
                  {r.status === 'VALID' ? '✓' : '!'}
                </span>
                <span className={styles.historyInfo}>
                  <span className={styles.historyTeam}>{r.teamName}</span>
                  <span className={styles.historyMeta}>
                    {r.species} · {r.when}
                  </span>
                </span>
                <span className={styles.historyWeight}>{r.weightKg.toFixed(1)} kg</span>
              </div>
            ))
          )}
        </>
      )}

      {/* Bottom nav */}
      <nav className={styles.bottomNav}>
        <button
          type="button"
          className={`${styles.navItem} ${screen === 'home' ? styles.active : ''}`}
          onClick={() => setScreen('home')}
        >
          <span className={styles.navIco}>⌂</span>
          Accueil
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${screen === 'teams' || screen === 'catch' ? styles.active : ''}`}
          onClick={() => setScreen('teams')}
        >
          <span className={styles.navIco}>＋</span>
          Saisir
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${screen === 'history' ? styles.active : ''}`}
          onClick={() => setScreen('history')}
        >
          <span className={styles.navIco}>≣</span>
          Historique
        </button>
      </nav>
    </div>
  )
}
