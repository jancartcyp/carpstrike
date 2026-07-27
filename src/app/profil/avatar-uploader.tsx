'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { createAvatarUpload, updateAvatar } from '@/app/actions/profile'
import { createClient } from '@/lib/supabase/client'
import styles from './profil.module.css'

const AVATARS_BUCKET = 'avatars'
const MAX_BYTES = 5 * 1024 * 1024 // 5 Mo

export function AvatarUploader({ avatarUrl, initials }: { avatarUrl: string | null; initials: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [, action] = useActionState(updateAvatar, undefined)
  const [, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Choisis une image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Image trop lourde (5 Mo max).')
      return
    }
    setBusy(true)
    try {
      const prep = await createAvatarUpload()
      if (!prep.ok) {
        setError(prep.message)
        return
      }
      const supabase = createClient()
      const { error: upErr } = await supabase.storage
        .from(AVATARS_BUCKET)
        .uploadToSignedUrl(prep.path, prep.token, file, { contentType: file.type })
      if (upErr) {
        setError("Échec de l'envoi. Réessaie.")
        return
      }
      const publicUrl = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(prep.path).data.publicUrl
      const fd = new FormData()
      fd.set('avatarUrl', publicUrl)
      startTransition(() => action(fd))
    } catch {
      setError("Échec de l'envoi. Réessaie.")
    } finally {
      setBusy(false)
      // Autorise la re-sélection du même fichier.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ border: 0, padding: 0, background: 'none', cursor: 'pointer', borderRadius: '50%', display: 'block' }}
        aria-label="Changer la photo de profil"
        title="Changer la photo de profil"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Photo de profil"
            className={styles.avatar}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className={styles.avatar}>{initials}</div>
        )}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'var(--red)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            border: '2px solid var(--bg, #0a0908)',
          }}
        >
          {busy ? '…' : '✎'}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
      {error && (
        <div style={{ fontSize: '0.72rem', color: 'var(--red)', marginTop: 6, maxWidth: 160 }}>{error}</div>
      )}
    </div>
  )
}
