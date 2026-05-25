import exifr from 'exifr'

export async function extractPhotoMeta(file) {
  try {
    const exif = await exifr.parse(file, {
      gps: true,
      pick: ['DateTimeOriginal', 'latitude', 'longitude', 'GPSLatitude', 'GPSLongitude'],
    })
    if (!exif) return { lat: null, lon: null, datetime: null }
    return {
      lat: exif.latitude ?? null,
      lon: exif.longitude ?? null,
      datetime: exif.DateTimeOriginal ?? null,
    }
  } catch {
    return { lat: null, lon: null, datetime: null }
  }
}

export function formatCoordinates(lat, lon) {
  if (lat == null || lon == null) return null
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`
}

export function formatExifDate(dt) {
  if (!dt) return null
  const d = dt instanceof Date ? dt : new Date(dt)
  if (isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

export function resizeImageToDataUrl(file, maxPx = 800) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.60))
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}
