const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'

export class ChatSocket {
  constructor(token, handlers) {
    this.token = token
    this.handlers = handlers
    this.reconnectAttempts = 0
    this.maxReconnects = 3
    this.pingInterval = null
  }

  connect() {
    this.ws = new WebSocket(`${WS_URL}/ws?token=${this.token}`)

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected')
      this.reconnectAttempts = 0
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)
    }

    this.ws.onmessage = (event) => {
      let parsed
      try {
        parsed = JSON.parse(event.data)
      } catch {
        return
      }

      switch (parsed.type) {
        case 'message':  this.handlers.onMessage?.(parsed.payload);  break
        case 'joined':   this.handlers.onJoined?.(parsed.payload);   break
        case 'left':     this.handlers.onLeft?.(parsed.payload);     break
        case 'typing':   this.handlers.onTyping?.(parsed.payload);   break
        case 'pong':     /* keepalive, ignore */                     break
        case 'error':    this.handlers.onError?.(parsed.payload);    break
      }
    }

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    this.ws.onclose = () => {
      clearInterval(this.pingInterval)

      if (this.reconnectAttempts < this.maxReconnects) {
        const delay = Math.pow(2, this.reconnectAttempts) * 1000
        this.reconnectAttempts++
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
        setTimeout(() => this.connect(), delay)
      } else {
        this.handlers.onError?.({ message: 'Connection lost. Please rejoin.' })
      }
    }
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    }
  }

  sendMessage(ciphertext, iv) {
    this.send('message', { ciphertext, iv })
  }

  sendTyping(isTyping) {
    this.send('typing', { isTyping })
  }

  disconnect() {
    this.reconnectAttempts = this.maxReconnects // prevent reconnect loop
    clearInterval(this.pingInterval)
    this.ws?.close()
  }
}