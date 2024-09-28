import type { RGB } from './types'

export function getUint16(input: Uint8Array, offset: number) {
  return (input[offset + 1] << 8) | input[offset]
}

export function toRGB(rgb: RGB): Uint8Array {
  if (Array.isArray(rgb)) {
    return Uint8Array.of(rgb[0], rgb[1], rgb[2])
  } else if (typeof rgb === 'string') {
    if (rgb.startsWith('#')) rgb = rgb.slice(1)
    rgb = Number.parseInt(rgb, 16)
  }
  if (rgb >= 0 && rgb <= 0xffffff) {
    return Uint8Array.of(rgb >> 16, rgb >> 8, rgb)
  }
  throw new Error('Invalid RGB format')
}

export function equals(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength !== b.byteLength) return false
  for (let offset = 0; offset < a.length; offset++) {
    if (a[offset] !== b[offset]) return false
  }
  return true
}