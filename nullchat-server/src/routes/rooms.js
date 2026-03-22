
import createRoomService from '../services/roomService.js'

export default async function roomRoutes(server) {

  const roomService = createRoomService(server.redis)

  server.post('/rooms/create', {
    schema: {
      body: {
        type: 'object',
        required: ['roomId', 'keyHash'],       
        properties: {
          roomId:  { type: 'string', minLength: 12, maxLength: 20 },
          keyHash: { type: 'string', minLength: 10 },  
        }
      }
    }
  }, async (request, reply) => {
    const { roomId, keyHash } = request.body  

    try {
      const room = await roomService.createRoom({ roomId, keyHash })

      const token = server.jwt.sign(
        { roomId, role: 'creator' },
        { expiresIn: '24h' }
      )

      reply.status(201).send({
        success: true,
        roomId: room.roomId,
        token,
        expiresAt: room.expiresAt,
      })

    } catch (err) {
      if (err.message === 'ROOM_EXISTS') {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Room ID already exists. Generate a new one.',
        })
      }
      throw err
    }
  })

  server.post('/rooms/join', {
    schema: {
      body: {
        type: 'object',
        required: ['roomId', 'keyHash'],       
        properties: {
          roomId:  { type: 'string' },
          keyHash: { type: 'string' },         
        }
      }
    }
  }, async (request, reply) => {
    const { roomId, keyHash } = request.body 

    try {
      const room = await roomService.verifyRoom({ roomId, keyHash })

      const token = server.jwt.sign(
        { roomId, role: 'member' },
        { expiresIn: '24h' }
      )

      reply.status(200).send({
        success: true,
        roomId: room.roomId,
        token,
        participants: room.participants,
        expiresAt: room.expiresAt,
      })

    } catch (err) {
      if (err.message === 'ROOM_NOT_FOUND') {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Room does not exist or has expired.',
        })
      }
      if (err.message === 'INVALID_KEY') {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid room ID or access key.',
        })
      }
      throw err
    }
  })

  server.get('/rooms/:roomId/status', async (request, reply) => {
    const { roomId } = request.params
    const status = await roomService.getRoomStatus(roomId)

    if (!status) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Room does not exist or has expired.',
      })
    }

    reply.send(status)
  })
}