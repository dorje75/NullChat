const ROOM_TTL = 60 * 60 * 24 

export default function createRoomService(redis) {

  
  const roomKey = (roomId) => `room:${roomId}`

  return {

    async createRoom({ roomId, keyHash }) {
      const key = roomKey(roomId)

      const exists = await redis.exists(key)
      if (exists) {
        throw new Error('ROOM_EXISTS')
      }

      const now = Date.now()
      const expiresAt = now + ROOM_TTL * 1000

      await redis.hset(key, {
        keyHash,
        createdAt: now,
        expiresAt,
        participants: 0,
      })

      await redis.expire(key, ROOM_TTL)

      return { roomId, createdAt: now, expiresAt }
    },

    async verifyRoom({ roomId, keyHash }) {
      const key = roomKey(roomId)

      const room = await redis.hgetall(key)

      if (!room || !room.keyHash) {
        throw new Error('ROOM_NOT_FOUND')
      }

      
      if (room.keyHash !== keyHash) {
        throw new Error('INVALID_KEY')
      }

      return {
        roomId,
        createdAt: parseInt(room.createdAt),
        expiresAt: parseInt(room.expiresAt),
        participants: parseInt(room.participants),
      }
    },

    async getRoomStatus(roomId) {
      const key = roomKey(roomId)
      const room = await redis.hgetall(key)

      if (!room || !room.keyHash) {
        return null
      }

      return {
        exists: true,
        participants: parseInt(room.participants),
        expiresAt: parseInt(room.expiresAt),
      }
    },

    async addParticipant(roomId) {
      return redis.hincrby(roomKey(roomId), 'participants', 1)
    },

    async removeParticipant(roomId) {
      return redis.hincrby(roomKey(roomId), 'participants', -1)
    },
  }
}