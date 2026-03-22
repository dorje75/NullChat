import { createHash, timingSafeEqual } from 'crypto'

export function hashKey(accessKey, roomId) {
  return createHash('sha256')
    .update(accessKey + roomId)
    .digest('hex')
}

export function safeCompare(a, b) {
  if (a.length !== b.length) return false
  return timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  )
}