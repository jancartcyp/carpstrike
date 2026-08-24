'use client'

import { useRef, useState } from 'react'
import { createPegMapUpload } from '@/app/actions/enduros'
import { compressImage } from '@/lib/image-compress'
import { createClient } from '@/lib/supabase/client'

const PLANS_BUCKET = 'plans'
const MAX_BYTES = 10 * 1024 * 1024 // 10 Mo avant compression

/**
 * Téléversement du plan des postes. L'image est compressée puis envoyée directement au
 * Storage (URL signée) ; seul le champ caché `pegMapUrl` part avec le formulaire parent.
 * Utilisable dans l'assistant de création comme dans les paramètres.
 */
export function PegMapUploader({ currentUrl }: { currentUrl?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string>(currentUrl ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Choisis une image (photo ou capture du plan).')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Image trop lourde (10 Mo maximum).')
      return
    }

    setBusy(true)
    try {
      // Un plan doit rester lisible quand on zoome → on garde 1800 px de large.
      const compressed = await compressImage(file, { maxPx: 1800, quality: 0.82, suffix: '' })

      const prep = await createPegMapUpload()
      if (!prep.ok) {
        setError(prep.message)
        return
      }
      const supabase = createClient()
      const bucket = supabase.storage.from(PLANS_BUCKET)
      const { error: upErr } = await bucket.uploadToSignedUrl(prep.path, prep.token, compressed, {
        contentType: 'image/jpeg',
      })
      if (upErr) {
        setError("Échec de l'envoi. Réessaie.")
        return
      }
      setUrl(bucket.getPublicUrl(prep.path).data.publicUrl)
    } catch {
      setError("Échec de l'envoi. Réessaie.")
    } finally {
      setBusy(false)
      // Autorise la re-sélection du même fichier.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Valeur transmise au formulaire parent (vide = pas de plan). */}
      <input type="hidden" name="pegMapUrl" value={url} />

      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Plan des postes"
            style={{
              width: '100%',
              maxHeight: 260,
              objectFit: 'contain',
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'rgba(0,0,0,0.35)',
              display: 'block',
            }}
          />
        </a>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: '0.8rem' }}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Envoi…' : url ? 'Remplacer le plan' : '📐 Ajouter un plan des postes'}
        </button>
        {url && !busy && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem' }}
            onClick={() => setUrl('')}
          >
            Retirer
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />

      {error ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--red)' }}>{error}</p>
      ) : (
        <p style={{ fontSize: '0.78rem', color: 'var(--dim)' }}>
          Photo ou capture du plan de l’étang avec la numérotation des postes. Visible par les
          participants sur la page de l’enduro.
        </p>
      )}
    </div>
  )
}
