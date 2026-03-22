const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function hashKey(accessKey, roomId) {
  const encoder = new TextEncoder()
  const data = encoder.encode(accessKey + ':' + roomId)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await response.json()
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed')
    error.status = response.status
    error.code = data.error
    throw error
  }
  return data
}

export const roomsApi = {

  async create(roomId, accessKey) {
    return request('/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({
        roomId,
        keyHash: await hashKey(accessKey, roomId),
      }),
    })
  },

  async join(roomId, accessKey) {
    return request('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({
        roomId,
        keyHash: await hashKey(accessKey, roomId),
      }),
    })
  },

  status(roomId) {
    return request(`/api/rooms/${roomId}/status`)
  },
}