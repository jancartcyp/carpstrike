'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Visionneuse plein écran : l'image s'ouvre par-dessus la page, avec zoom et
 * déplacement. Pensée pour lire les numéros sur un plan des postes depuis un mobile.
 *
 * Fermeture : bouton, touche Échap, ou clic sur le fond.
 */
export function ImageLightbox({
  src,
  alt,
  children,
}: {
  src: string
  alt: string
  /** Aperçu cliquable affiché dans la page. */
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(1)

  const close = useCallback(() => {
    setOpen(false)
    setZoom(1)
  }, [])

  // Échap pour fermer + blocage du défilement de la page pendant l'ouverture.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, close])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Agrandir : ${alt}`}
        style={{
          display: 'block',
          width: '100%',
          padding: 0,
          border: 0,
          background: 'none',
          cursor: 'zoom-in',
        }}
      >
        {children}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.94)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Barre d'actions */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 16px',
              flexShrink: 0,
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>{alt}</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10))}
                disabled={zoom <= 1}
                aria-label="Dézoomer"
                style={btnStyle(zoom <= 1)}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4, Math.round((z + 0.5) * 10) / 10))}
                disabled={zoom >= 4}
                aria-label="Zoomer"
                style={btnStyle(zoom >= 4)}
              >
                +
              </button>
              <button type="button" onClick={close} aria-label="Fermer" style={btnStyle(false)}>
                ✕
              </button>
            </span>
          </div>

          {/* Zone d'image : défilable quand on a zoomé (glisser pour se déplacer). */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: zoom > 1 ? 'flex-start' : 'center',
              justifyContent: zoom > 1 ? 'flex-start' : 'center',
              padding: 12,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              onClick={() => setZoom((z) => (z >= 4 ? 1 : z + 1))}
              style={{
                width: zoom > 1 ? `${zoom * 100}%` : 'auto',
                maxWidth: zoom > 1 ? 'none' : '100%',
                maxHeight: zoom > 1 ? 'none' : '100%',
                objectFit: 'contain',
                cursor: zoom >= 4 ? 'zoom-out' : 'zoom-in',
                margin: 'auto',
                display: 'block',
              }}
            />
          </div>

          <p
            onClick={(e) => e.stopPropagation()}
            style={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.75rem',
              padding: '0 16px 14px',
              margin: 0,
              flexShrink: 0,
            }}
          >
            Touchez l’image pour zoomer · Échap ou ✕ pour fermer
          </p>
        </div>
      )}
    </>
  )
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 38,
    height: 38,
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
    fontSize: '1rem',
    cursor: disabled ? 'default' : 'pointer',
    lineHeight: 1,
  }
}
