
const rooms = new Map()

export default {

  join(roomId, socket) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set())
    }
    rooms.get(roomId).add(socket)
    return rooms.get(roomId).size 
  },

  leave(roomId, socket) {
    if (!rooms.has(roomId)) return 0
    rooms.get(roomId).delete(socket)
    const size = rooms.get(roomId).size
    if (size === 0) rooms.delete(roomId)
    return size
  },

  // Send a message to everyone in a room EXCEPT the sender
  broadcast(roomId, message, senderSocket) {
    if (!rooms.has(roomId)) return
    const payload = JSON.stringify(message)
    for (const socket of rooms.get(roomId)) {
      if (socket !== senderSocket && socket.readyState === 1) {
        socket.send(payload)
      }
    }
  },

  // Send to everyone INCLUDING the sender
  broadcastAll(roomId, message) {
    if (!rooms.has(roomId)) return
    const payload = JSON.stringify(message)
    for (const socket of rooms.get(roomId)) {
      if (socket.readyState === 1) {
        socket.send(payload)
      }
    }
  },

  getCount(roomId) {
    return rooms.has(roomId) ? rooms.get(roomId).size : 0
  }
}