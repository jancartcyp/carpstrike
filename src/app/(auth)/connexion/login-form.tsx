'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

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

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {state?.message && (
        <p
          style={{
            color: 'var(--red-bright)',
            fontSize: '0.9rem',
            padding: '10px 14px',
            background: 'var(--red-dim)',
            border: '1px solid var(--red)',
          }}
        >
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="email" style={labelStyle}>
          Email
        </label>
        <input id="email" name="email" type="email" required style={inputStyle} />
        {state?.errors?.email && (
          <p style={{ color: 'var(--red-bright)', fontSize: '0.8rem', marginTop: 4 }}>
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" style={labelStyle}>
          Mot de passe
        </label>
        <input id="password" name="password" type="password" required style={inputStyle} />
        {state?.errors?.password && (
          <p style={{ color: 'var(--red-bright)', fontSize: '0.8rem', marginTop: 4 }}>
            {state.errors.password[0]}
          </p>
        )}
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary" style={{ marginTop: 8 }}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>

      <p style={{ fontSize: '0.9rem', color: 'var(--dim)', textAlign: 'center' }}>
        Pas encore de compte ?{' '}
        <Link href="/inscription" style={{ color: 'var(--red-bright)' }}>
          Créer un compte
        </Link>
      </p>
    </form>
  )
}
