/**
 * Compression d'image côté navigateur (API Canvas, sans dépendance).
 *
 * Les photos de smartphone font 3–5 Mo pour ~4000 px de large, alors qu'un écran n'en
 * affiche jamais plus de ~1600. On redimensionne et recompresse donc AVANT l'envoi :
 * stockage et bande passante divisés par ~14, et upload d'autant plus rapide sur le terrain.
 */

/** Version pleine (affichage au clic) : large côté max 1600 px. */
export const FULL_MAX_PX = 1600
export const FULL_QUALITY = 0.8

/** Miniature (listes, galeries) : large côté max 400 px. */
export const THUMB_MAX_PX = 400
export const THUMB_QUALITY = 0.75

/** Avatars : jamais affichés au-delà de ~128 px, 400 px suffit largement. */
export const AVATAR_MAX_PX = 400
export const AVATAR_QUALITY = 0.82

async function loadBitmap(file: File): Promise<ImageBitmap> {
  // `imageOrientation: 'from-image'` applique l'orientation EXIF : sans ça, les photos
  // prises en portrait ressortent tournées après passage par le canvas.
  return createImageBitmap(file, { imageOrientation: 'from-image' })
}

function targetSize(w: number, h: number, maxPx: number) {
  const largest = Math.max(w, h)
  if (largest <= maxPx) return { width: w, height: h }
  const ratio = maxPx / largest
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}

/** Redimensionne + recompresse une image en JPEG. Renvoie un `File` prêt à l'upload. */
export async function compressImage(
  file: File,
  { maxPx, quality, suffix }: { maxPx: number; quality: number; suffix: string }
): Promise<File> {
  const bitmap = await loadBitmap(file)
  const { width, height } = targetSize(bitmap.width, bitmap.height, maxPx)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas indisponible')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  )
  if (!blob) throw new Error('Compression impossible')

  const base = file.name.replace(/\.[^.]+$/, '') || 'photo'
  return new File([blob], `${base}${suffix}.jpg`, { type: 'image/jpeg' })
}

/** Prépare les deux versions d'une photo de prise : pleine + miniature. */
export async function compressCatchPhoto(file: File): Promise<{ full: File; thumb: File }> {
  const [full, thumb] = await Promise.all([
    compressImage(file, { maxPx: FULL_MAX_PX, quality: FULL_QUALITY, suffix: '' }),
    compressImage(file, { maxPx: THUMB_MAX_PX, quality: THUMB_QUALITY, suffix: '-thumb' }),
  ])
  return { full, thumb }
}

/** Prépare une photo de profil (une seule version, légère). */
export async function compressAvatar(file: File): Promise<File> {
  return compressImage(file, { maxPx: AVATAR_MAX_PX, quality: AVATAR_QUALITY, suffix: '' })
}
