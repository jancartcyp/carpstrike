import { switchSpace } from '@/app/actions/auth'
import { SPACE_LABEL, type SpaceMode } from '@/lib/auth/space'

/**
 * Bandeau affiché lorsqu'on a été redirigé parce que la page demandée appartient
 * à l'autre espace. Propose de basculer sans se reconnecter.
 */
export function SpaceNotice({ space }: { space: SpaceMode }) {
  const other: SpaceMode = space === 'organizer' ? 'fisherman' : 'organizer'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        padding: '12px 16px',
        margin: '0 0 20px',
        borderRadius: 10,
        border: '1px solid var(--line-bright)',
        background: 'rgba(255,255,255,0.03)',
        fontSize: '0.88rem',
        color: 'var(--dim)',
      }}
    >
      <span>
        Tu es connecté dans l’espace <strong style={{ color: 'var(--white)' }}>{SPACE_LABEL[space]}</strong>.
        La page demandée appartient à l’espace {SPACE_LABEL[other].toLowerCase()}.
      </span>
      <form action={switchSpace} style={{ marginLeft: 'auto' }}>
        <input type="hidden" name="space" value={other} />
        <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
          ⇄ Passer en {SPACE_LABEL[other].toLowerCase()}
        </button>
      </form>
    </div>
  )
}
