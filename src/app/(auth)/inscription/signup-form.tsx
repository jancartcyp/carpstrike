'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signup } from '@/app/actions/auth'
import { SpaceChoice } from '../space-choice'

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

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return (
    <p style={{ color: 'var(--red-bright)', fontSize: '0.8rem', marginTop: 4 }}>{messages[0]}</p>
  )
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined)

  // Inscription réussie : on remplace le formulaire par une confirmation qui rappelle
  // l'adresse saisie — la faute de frappe est la première cause d'email jamais reçu.
  if (state?.ok) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: '2.4rem', textAlign: 'center' }}>✉️</div>
        <h2
          style={{
            fontFamily: 'var(--font-barlow-condensed), sans-serif',
            fontWeight: 800,
            fontSize: '1.5rem',
            color: 'var(--white)',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Compte créé !
        </h2>

        <p style={{ color: 'var(--dim)', fontSize: '0.95rem', lineHeight: 1.6, textAlign: 'center' }}>
          Un email de confirmation vient d’être envoyé à
          <br />
          <strong style={{ color: 'var(--white)', wordBreak: 'break-all' }}>{state.email}</strong>
        </p>
        <p style={{ color: 'var(--dim)', fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'center' }}>
          Clique sur le lien qu’il contient pour activer ton compte, puis connecte-toi.
        </p>

        <div
          style={{
            padding: '14px 16px',
            border: '1px solid var(--line-bright)',
            background: 'rgba(255,255,255,0.03)',
            fontSize: '0.85rem',
            color: 'var(--dim)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--white)' }}>Tu ne reçois rien ?</strong>
          <br />
          Regarde d’abord dans tes <strong style={{ color: 'var(--white)' }}>spams</strong>. Si
          l’email n’arrive toujours pas au bout de quelques minutes, l’adresse ci-dessus comporte
          peut-être une faute de frappe — dans ce cas, refais une inscription avec la bonne adresse.
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/connexion" className="btn btn-primary">
            Aller à la connexion
          </Link>
          <Link href="/inscription" className="btn btn-ghost">
            Corriger mon adresse
          </Link>
        </div>
      </div>
    )
  }

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

      <SpaceChoice label="Je crée un compte en tant que" />

      <p style={{ fontSize: '0.85rem', color: 'var(--dim)', lineHeight: 1.5 }}>
        Une même adresse email peut servir aux deux espaces : tu choisis simplement lequel utiliser
        à la connexion.
      </p>

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
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          style={inputStyle}
        />
        <FieldError messages={state?.errors?.password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" style={labelStyle}>
          Confirme le mot de passe
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          style={inputStyle}
        />
        <FieldError messages={state?.errors?.confirmPassword} />
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
