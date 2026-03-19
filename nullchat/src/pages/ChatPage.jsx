import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import ChatBubble from '../components/ChatBubble.jsx'
import CopyButton from '../components/CopyButton.jsx'
import QRModal from '../components/QRModal.jsx'
import { getDemoMessages, formatTime } from '../utils/crypto.js'
import styles from './ChatPage.module.css'

export default function ChatPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const { roomId, accessKey } = location.state || {}

  // Redirect if no credentials
  useEffect(() => {
    if (!roomId || !accessKey) navigate('/', { replace: true })
  }, [roomId, accessKey, navigate])

  const [messages, setMessages] = useState(() =>
    roomId ? getDemoMessages(roomId) : []
  )
  const [input, setInput] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simulate "other user typing" occasionally
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 2500)
    }, 5000)
    return () => clearTimeout(timer)
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return

    const newMsg = {
      id: Date.now(),
      sender: 'you',
      text,
      time: formatTime(new Date()),
      isOwn: true,
    }
    setMessages((prev) => [...prev, newMsg])
    setInput('')
    inputRef.current?.focus()

    // Simulate a reply after a short delay
    if (Math.random() > 0.4) {
      const replies = [
        'received.',
        'copy that.',
        'stand by.',
        'confirmed.',
        'on it.',
        '10-4.',
      ]
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ghost_4f2a',
            text: replies[Math.floor(Math.random() * replies.length)],
            time: formatTime(new Date()),
            isOwn: false,
          },
        ])
      }, 1500 + Math.random() * 1000)
      setTimeout(() => setIsTyping(true), 600)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleLeave = () => {
    navigate('/')
  }

  if (!roomId) return null

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <aside className={`${styles.sidebar} ${showSidebar ? styles.sidebarOpen : styles.sidebarClosed}`}>
          <div className={styles.sidebarTop}>
            <Logo size="sm" />
            <button
              className={styles.toggleSidebar}
              onClick={() => setShowSidebar((v) => !v)}
              title={showSidebar ? 'Collapse' : 'Expand'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showSidebar
                  ? <><polyline points="15 18 9 12 15 6" /></>
                  : <><polyline points="9 18 15 12 9 6" /></>
                }
              </svg>
            </button>
          </div>

          {showSidebar && (
            <div className={styles.sidebarContent}>
              {/* Room Info */}
              <div className={styles.roomCard}>
                <div className={styles.roomCardHeader}>
                  <span className={styles.roomCardLabel}>ACTIVE ROOM</span>
                  <div className={styles.liveDot}>
                    <span className={styles.livePulse} />
                    LIVE
                  </div>
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

              {/* Key Info */}
              <div className={styles.keyCard}>
                <div className={styles.keyCardLabel}>SESSION KEY</div>
                <div className={styles.keyValue}>{accessKey}</div>
                <CopyButton text={accessKey} label="key" />
              </div>

              {/* Participants */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>PARTICIPANTS (2)</div>
                <div className={styles.participantList}>
                  <div className={styles.participant}>
                    <div className={`${styles.participantAvatar} ${styles.you}`}>Y</div>
                    <div>
                      <div className={styles.participantName}>you</div>
                      <div className={styles.participantStatus}>online</div>
                    </div>
                  </div>
                  <div className={styles.participant}>
                    <div className={styles.participantAvatar}>G</div>
                    <div>
                      <div className={styles.participantName}>ghost_4f2a</div>
                      <div className={styles.participantStatus}>online</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className={styles.securityBadge}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                E2E Encrypted
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

        {/* ── Main Chat ── */}
        <main className={styles.main}>
          {/* Chat Header */}
          <header className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              {!showSidebar && (
                <button className={styles.menuBtn} onClick={() => setShowSidebar(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              )}
              <div>
                <div className={styles.chatRoomId}>
                  <span className={styles.hashIcon}>#</span>
                  {roomId}
                </div>
                <div className={styles.chatSubtitle}>
                  <span className={styles.encDot} />
                  encrypted channel · 2 participants
                </div>
              </div>
            </div>
            <div className={styles.chatHeaderRight}>
              <button className={styles.headerBtn} onClick={() => setShowQR(true)} title="Show QR">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" /><rect x="17" y="17" width="4" height="4" />
                </svg>
              </button>
              <button className={styles.headerBtn} onClick={handleLeave} title="Leave room">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className={styles.messages}>
            <div className={styles.messageList}>
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className={styles.typingIndicator}>
                  <div className={styles.typingAvatar}>G</div>
                  <div className={styles.typingBubble}>
                    <span /><span /><span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input bar */}
          <div className={styles.inputBar}>
            <div className={styles.inputWrap}>
              <textarea
                ref={inputRef}
                className={styles.textarea}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                rows={1}
              />
              <button
                className={`${styles.sendBtn} ${input.trim() ? styles.sendActive : ''}`}
                onClick={handleSend}
                disabled={!input.trim()}
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
        <QRModal
          roomId={roomId}
          accessKey={accessKey}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  )
}
