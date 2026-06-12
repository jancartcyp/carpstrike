export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: 12,
        color: 'var(--dim)',
        fontFamily: 'var(--font-rajdhani)',
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontSize: '0.85rem',
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'var(--red)',
          boxShadow: '0 0 10px var(--red)',
          animation: 'pulse 1.2s ease-in-out infinite',
        }}
      />
      Chargement…
    </div>
  )
}
