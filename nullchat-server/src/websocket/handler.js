import roomManager from './roomManager.js'
import createRoomService from '../services/roomService.js'

export default async function wsHandler(server) {

  const roomService = createRoomService(server.redis)

  server.get('/ws', { websocket: true }, async (socket, request) => {

    const token = request.query.token

    if (!token) {
      socket.send(JSON.stringify({
        type: 'error',
        payload: { message: 'No token provided' }
      }))
      socket.close()
      return
    }

    let user
    try {
      user = server.jwt.verify(token)
    } catch (err) {
      socket.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Invalid or expired token' }
      }))
      socket.close()
      return
    }

    const { roomId } = user

    // Check room still exists in Redis
    const roomStatus = await roomService.getRoomStatus(roomId)
    if (!roomStatus) {
      socket.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Room not found or expired' }
      }))
      socket.close()
      return
    }

    // join room
    const currentCount = roomManager.getCount(roomId)
    if (currentCount >= 10) {
      socket.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Room is full' }
      }))
      socket.close()
      return
    }

const count = roomManager.join(roomId, socket)
await roomService.addParticipant(roomId)

    
    roomManager.broadcastAll(roomId, {
      type: 'joined',
      payload: {
        participantCount: count,
        timestamp: Date.now()
      }
    })

    server.log.info(`Socket joined room ${roomId} | ${count} participants`)

    
    socket.on('message', (rawMessage) => {
      let parsed

      
      try {
        parsed = JSON.parse(rawMessage.toString())
      } catch {
        socket.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' }
        }))
        return
      }

      const { type, payload } = parsed

      switch (type) {

        case 'message':
          if (!payload?.ciphertext || !payload?.iv) {
            socket.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Message must have ciphertext and iv' }
            }))
            return
          }

          roomManager.broadcast(roomId, {
            type: 'message',
            payload: {
              ciphertext: payload.ciphertext,
              iv: payload.iv,
              timestamp: Date.now(),
              senderId: generateSenderId(socket)
            }
          }, socket)
          break

        case 'typing':
          roomManager.broadcast(roomId, {
            type: 'typing',
            payload: {
              isTyping: !!payload?.isTyping,
              senderId: generateSenderId(socket)
            }
          }, socket)
          break

          // Keepalive — client sends ping, server sends pong
          socket.send(JSON.stringify({ type: 'pong' }))
          break

        default:
          socket.send(JSON.stringify({
            type: 'error',
            payload: { message: `Unknown message type: ${type}` }
          }))
      }
    })

    socket.on('close', async () => {
      const count = roomManager.leave(roomId, socket)
      await roomService.removeParticipant(roomId)

      roomManager.broadcastAll(roomId, {
        type: 'left',
        payload: {
          participantCount: count,
          timestamp: Date.now()
        }
      })

      server.log.info(`Socket left room ${roomId} | ${count} remaining`)
    })

    socket.on('error', (err) => {
      server.log.error({ err }, 'WebSocket error')
    })
  })
}

// Generate a consistent anonymous ID for a socket
// Same socket always gets same ID within a session
// Uses WeakMap so it gets garbage collected when socket closes
const senderIds = new WeakMap()
let senderCounter = 0

function generateSenderId(socket) {
  if (!senderIds.has(socket)) {
    senderIds.set(socket, `user_${++senderCounter}`)
  }
  return senderIds.get(socket)
}