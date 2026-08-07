/**
 * Client-side image compression for phone photos.
 * Phone cameras produce very large files (often 5-12MB). This downscales and
 * re-encodes the image so uploads stay under the API's 5MB limit and are fast.
 */
export async function compressImage(
  file: File,
  options: { maxDimension?: number; quality?: number; maxBytes?: number } = {},
): Promise<File> {
  const { maxDimension = 1920, quality = 0.8, maxBytes = 5 * 1024 * 1024 } = options

  // Non-images or already-small files: return unchanged
  if (!file.type.startsWith('image/')) return file

  // GIFs / SVGs should not be canvas-re-encoded (would lose animation/vectors)
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file

  const dataUrl = await readFileAsDataUrl(file)
  const img = await loadImage(dataUrl)

  let { width, height } = img
  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width)
      width = maxDimension
    } else {
      width = Math.round((width * maxDimension) / height)
      height = maxDimension
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(img, 0, 0, width, height)

  // Re-encode, stepping down quality until under the size budget
  let q = quality
  let blob = await canvasToBlob(canvas, q)
  while (blob && blob.size > maxBytes && q > 0.4) {
    q -= 0.1
    blob = await canvasToBlob(canvas, q)
  }

  if (!blob) return file

  // If compression didn't help, keep the smaller of the two
  if (blob.size >= file.size) return file

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  })
}
