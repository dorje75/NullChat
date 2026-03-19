export function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const seg = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `NULL-${seg(4)}-${seg(4)}`
}

export function generateAccessKey() {
  const hex = '0123456789abcdef'
  const seg = (len) =>
    Array.from({ length: len }, () => hex[Math.floor(Math.random() * hex.length)]).join('')
  return `${seg(8)}-${seg(4)}-${seg(4)}-${seg(8)}`
}


export function encodeQRPayload(roomId, key) {
  return `nullchat://join?room=${encodeURIComponent(roomId)}&key=${encodeURIComponent(key)}`
}


export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}


export function validateRoomId(id) {
  return /^NULL-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(id.trim())
}


export function validateKey(key) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{8}$/.test(key.trim())
}


export function getDemoMessages(roomId) {
  return [
    {
      id: 1,
      sender: 'sys',
      text: `You joined room ${roomId}. This channel is end-to-end encrypted.`,
      time: formatTime(new Date(Date.now() - 120000)),
      isSystem: true,
    },
    {
      id: 2,
      sender: 'ghost_4f2a',
      text: 'hey, are you there?',
      time: formatTime(new Date(Date.now() - 90000)),
      isOwn: false,
    },
    {
      id: 3,
      sender: 'ghost_4f2a',
      text: 'i sent you the decryption payload',
      time: formatTime(new Date(Date.now() - 88000)),
      isOwn: false,
    },
    {
      id: 4,
      sender: 'you',
      text: 'got it, checking now',
      time: formatTime(new Date(Date.now() - 60000)),
      isOwn: true,
    },
    {
      id: 5,
      sender: 'you',
      text: 'looks clean. passing to the other node.',
      time: formatTime(new Date(Date.now() - 55000)),
      isOwn: true,
    },
    {
      id: 6,
      sender: 'ghost_4f2a',
      text: 'good. delete after confirmed.',
      time: formatTime(new Date(Date.now() - 30000)),
      isOwn: false,
    },
  ]
}

export function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}
