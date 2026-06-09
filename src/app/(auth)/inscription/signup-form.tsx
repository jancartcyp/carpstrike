'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { signup } from '@/app/actions/auth'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--panel-2, #1a1814)',
  border: '1px solid var(--line-bright)',
  color: 'var(--white)',
  fontFamily: 'var(--font-barlow)',
  fontSize: '1rem',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-rajdhani)',
  fontWeight: 600,
  fontSize: '0.8rem',
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: 'var(--dim)',
  marginBottom: 6,
  display: 'block',
}

const roles = [
  { value: 'FISHERMAN', label: 'Pêcheur', desc: 'Je participe aux enduros' },
  { value: 'ORGANIZER', label: 'Organisateur', desc: "J'organise des enduros" },
] as const

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return (
    <p style={{ color: 'var(--red-bright)', fontSize: '0.8rem', marginTop: 4 }}>{messages[0]}</p>
  )
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined)
  const [role, setRole] = useState<'FISHERMAN' | 'ORGANIZER'>('FISHERMAN')

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {state?.message && (
        <p
          style={{
            color: 'var(--white)',
            fontSize: '0.9rem',
            padding: '10px 14px',
            background: 'var(--red-dim)',
            border: '1px solid var(--red)',
          }}
        >
          {state.message}
        </p>
      )}

      {/* Sélection du rôle */}
      <div>
        <span style={labelStyle}>Je suis…</span>
        <input type="hidden" name="role" value={role} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {roles.map((r) => {
            const selected = role === r.value
            return (
              <button
                type="button"
                key={r.value}
                onClick={() => setRole(r.value)}
                style={{
                  padding: '12px 10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: selected ? 'var(--red-dim)' : 'var(--panel-2, #1a1814)',
                  border: `1px solid ${selected ? 'var(--red)' : 'var(--line-bright)'}`,
                  color: 'var(--white)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-barlow-condensed)',
                    fontWeight: 700,
                    fontStyle: 'italic',
                    textTransform: 'uppercase',
                    fontSize: '1rem',
                    display: 'block',
                  }}
                >
                  {r.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--dim)' }}>{r.desc}</span>
              </button>
            )
          })}
        </div>
        <FieldError messages={state?.errors?.role} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label htmlFor="firstName" style={labelStyle}>
            Prénom
          </label>
          <input id="firstName" name="firstName" required style={inputStyle} />
          <FieldError messages={state?.errors?.firstName} />
        </div>
        <div>
          <label htmlFor="lastName" style={labelStyle}>
            Nom
          </label>
          <input id="lastName" name="lastName" required style={inputStyle} />
          <FieldError messages={state?.errors?.lastName} />
        </div>
      </div>

      <div>
        <label htmlFor="email" style={labelStyle}>
          Email
        </label>
        <input id="email" name="email" type="email" required style={inputStyle} />
        <FieldError messages={state?.errors?.email} />
      </div>

      <div>
        <label htmlFor="password" style={labelStyle}>
          Mot de passe
        </label>
        <input id="password" name="password" type="password" required style={inputStyle} />
        <FieldError messages={state?.errors?.password} />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary" style={{ marginTop: 8 }}>
        {pending ? 'Création…' : 'Créer mon compte'}
      </button>

      <p style={{ fontSize: '0.9rem', color: 'var(--dim)', textAlign: 'center' }}>
        Déjà un compte ?{' '}
        <Link href="/connexion" style={{ color: 'var(--red-bright)' }}>
          Se connecter
        </Link>
      </p>
    </form>
  )
}
