'use client'

import { useState } from 'react'
import type { SpaceMode } from '@/lib/auth/space'

const OPTIONS: { value: SpaceMode; icon: string; label: string; sub: string }[] = [
  { value: 'fisherman', icon: '🎣', label: 'Pêcheur', sub: 'Participer, suivre mes prises' },
  { value: 'organizer', icon: '🏁', label: 'Organisateur', sub: 'Créer et piloter un enduro' },
]

/**
 * Choix de l'espace (pêcheur / organisateur) pour la connexion et l'inscription.
 * Envoie la valeur via un champ caché `space`.
 */
export function SpaceChoice({
  defaultValue = 'fisherman',
  label = 'Je me connecte en tant que',
}: {
  defaultValue?: SpaceMode
  label?: string
}) {
  const [value, setValue] = useState<SpaceMode>(defaultValue)

  return (
    <div>
      <span
        style={{
          fontFamily: 'var(--font-rajdhani)',
          fontWeight: 600,
          fontSize: '0.8rem',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: 'var(--dim)',
          marginBottom: 8,
          display: 'block',
        }}
      >
        {label}
      </span>
      <input type="hidden" name="space" value={value} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {OPTIONS.map((o) => {
          const active = value === o.value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setValue(o.value)}
              aria-pressed={active}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                cursor: 'pointer',
                background: active ? 'var(--red-dim)' : 'var(--panel-2, #1a1814)',
                border: `1px solid ${active ? 'var(--red)' : 'var(--line-bright)'}`,
                color: 'var(--white)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{o.icon}</span>
              <span
                style={{
                  fontFamily: 'var(--font-barlow-condensed), sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: 0.5,
                }}
              >
                {o.label}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--dim)', lineHeight: 1.3 }}>{o.sub}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
