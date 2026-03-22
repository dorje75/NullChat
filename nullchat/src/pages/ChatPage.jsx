import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import ChatBubble from '../components/ChatBubble.jsx'
import CopyButton from '../components/CopyButton.jsx'
import QRModal from '../components/QRModal.jsx'
import { ChatSocket } from '../services/websocket.js'
import { roomsApi } from '../services/api.js'
import { deriveKey, encryptMessage, decryptMessage } from '../utils/encryption.js'
import { formatTime } from '../utils/crypto.js'
import styles from './ChatPage.module.css'

export default function ChatPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const { roomId, accessKey, token: initialToken } = location.state || {}

  useEffect(() => {
    if (!roomId || !accessKey) navigate('/', { replace: true })
  }, [roomId, accessKey, navigate])

  const [messages, setMessages]                     = useState([])
  const [input, setInput]                           = useState('')
  const [showQR, setShowQR]                         = useState(false)
  const [showSidebar, setShowSidebar]               = useState(true)
  const [isTyping, setIsTyping]                     = useState(false)
  const [participantCount, setParticipantCount]     = useState(1)
  const [connected, setConnected]                   = useState(false)
  const [wsToken, setWsToken]                       = useState(initialToken || null)

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)
  const socketRef      = useRef(null)
  const typingTimer    = useRef(null)
  const cryptoKeyRef   = useRef(null)   // holds derived AES-GCM key

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Derive encryption key as soon as we have credentials
  useEffect(() => {
    if (!accessKey || !roomId) return
    deriveKey(accessKey, roomId)
      .then(key => {
        cryptoKeyRef.current = key
        console.log('🔑 Encryption key derived')
      })
      .catch(err => console.error('Key derivation failed:', err))
  }, [accessKey, roomId])

  // Get token if creator (no token passed from LoginPage)
  useEffect(() => {
    if (!roomId || !accessKey) return
    if (wsToken) return
    roomsApi.join(roomId, accessKey)
      .then(data => setWsToken(data.token))
      .catch(() => navigate('/', { replace: true }))
  }, [roomId, accessKey, wsToken])

  // Connect WebSocket once token is ready
  useEffect(() => {
    if (!wsToken || !roomId) return

    const addSystem = (text) => setMessages(prev => [...prev, {
      id: Date.now(), sender: 'sys', text,
      time: formatTime(new Date()), isSystem: true,
    }])

    const socket = new ChatSocket(wsToken, {

      onJoined: (payload) => {
        setConnected(true)
        setParticipantCount(payload.participantCount)
        addSystem(`Connected to ${roomId} · ${payload.participantCount} participant(s)`)
      },

      onLeft: (payload) => {
        setParticipantCount(payload.participantCount)
        addSystem(`A participant left · ${payload.participantCount} remaining`)
      },

      // Decrypt incoming messages
      onMessage: async (payload) => {
        let text = '[encrypted message]'
        if (cryptoKeyRef.current) {
          text = await decryptMessage(
            cryptoKeyRef.current,
            payload.ciphertext,
            payload.iv
          )
        }
        setMessages(prev => [...prev, {
          id:     Date.now() + Math.random(),
          sender: payload.senderId,
          text,
          time:   formatTime(new Date()),
          isOwn:  false,
        }])
      },

      onTyping: (payload) => {
        setIsTyping(payload.isTyping)
        clearTimeout(typingTimer.current)
        if (payload.isTyping) {
          typingTimer.current = setTimeout(() => setIsTyping(false), 3000)
        }
      },

      onError: (payload) => {
        addSystem(`⚠ ${payload.message}`)
      },
    })

    socket.connect()
    socketRef.current = socket

    return () => {
      socketRef.current = null
      socket.disconnect()
      clearTimeout(typingTimer.current)
    }
  }, [wsToken, roomId])

  // Encrypt and send message
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || !socketRef.current) return

    // Show plaintext to yourself immediately (optimistic update)
    setMessages(prev => [...prev, {
      id:    Date.now(),
      sender: 'you',
      text,
      time:  formatTime(new Date()),
      isOwn: true,
    }])

    // Encrypt before sending over WebSocket
    if (cryptoKeyRef.current) {
      const { ciphertext, iv } = await encryptMessage(cryptoKeyRef.current, text)
      socketRef.current.sendMessage(ciphertext, iv)
    } else {
      // Key not ready — fallback (should not happen in normal flow)
      socketRef.current.sendMessage(text, 'no-key')
    }

    setInput('')
    inputRef.current?.focus()
  }, [input])

  const handleInputChange = (e) => {
    setInput(e.target.value)
    socketRef.current?.sendTyping(true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socketRef.current?.sendTyping(false)
    }, 2000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleLeave = () => {
    socketRef.current?.disconnect()
    navigate('/')
  }

  if (!roomId) return null

  return (
    <div className={styles.page}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.layout}>
        <aside className={`${styles.sidebar} ${showSidebar ? styles.sidebarOpen : styles.sidebarClosed}`}>
          <div className={styles.sidebarTop}>
            <Logo size="sm" />
            <button className={styles.toggleSidebar} onClick={() => setShowSidebar(v => !v)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showSidebar ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
              </svg>
            </button>
          </div>

          {showSidebar && (
            <div className={styles.sidebarContent}>
              <div className={styles.roomCard}>
                <div className={styles.roomCardHeader}>
                  <span className={styles.roomCardLabel}>ACTIVE ROOM</span>
                  <div className={styles.liveDot}><span className={styles.livePulse} />LIVE</div>
                </div>
                <div className={styles.roomId}>{roomId}</div>
                <div className={styles.roomCardActions}>
                  <CopyButton text={roomId} label="ID" />
                  <button className={styles.qrBtn} onClick={() => setShowQR(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" /><rect x="17" y="17" width="4" height="4" />
                    </svg>
                    QR
                  </button>
                </div>
              </div>

              <div className={styles.keyCard}>
                <div className={styles.keyCardLabel}>SESSION KEY</div>
                <div className={styles.keyValue}>{accessKey}</div>
                <CopyButton text={accessKey} label="key" />
              </div>

              <div className={styles.section}>
                <div className={styles.sectionLabel}>PARTICIPANTS ({participantCount})</div>
              </div>

              <div className={styles.securityBadge}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {connected ? 'E2E Encrypted' : 'Connecting...'}
              </div>

              <button className={styles.leaveBtn} onClick={handleLeave}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Leave Room
              </button>
            </div>
          )}
        </aside>

        <main className={styles.main}>
          <header className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              {!showSidebar && (
                <button className={styles.menuBtn} onClick={() => setShowSidebar(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              )}
              <div>
                <div className={styles.chatRoomId}>
                  <span className={styles.hashIcon}>#</span>{roomId}
                </div>
                <div className={styles.chatSubtitle}>
                  <span className={styles.encDot} />
                  encrypted channel · {participantCount} participant(s)
                </div>
              </div>
            </div>
            <div className={styles.chatHeaderRight}>
              <button className={styles.headerBtn} onClick={() => setShowQR(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" /><rect x="17" y="17" width="4" height="4" />
                </svg>
              </button>
              <button className={styles.headerBtn} onClick={handleLeave}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </header>

          <div className={styles.messages}>
            <div className={styles.messageList}>
              {messages.map(msg => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {isTyping && (
                <div className={styles.typingIndicator}>
                  <div className={styles.typingAvatar}>?</div>
                  <div className={styles.typingBubble}>
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className={styles.inputBar}>
            <div className={styles.inputWrap}>
              <textarea
                ref={inputRef}
                className={styles.textarea}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={connected ? 'Type a message... (Enter to send)' : 'Connecting...'}
                disabled={!connected}
                rows={1}
              />
              <button
                className={`${styles.sendBtn} ${input.trim() && connected ? styles.sendActive : ''}`}
                onClick={handleSend}
                disabled={!input.trim() || !connected}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className={styles.inputHint}>
              Messages are encrypted and never stored · Press <kbd>Enter</kbd> to send
            </p>
          </div>
        </main>
      </div>

      {showQR && (
        <QRModal roomId={roomId} accessKey={accessKey} onClose={() => setShowQR(false)} />
      )}
    </div>
  )
}