import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Logo from '../components/Logo.jsx'
import { roomsApi } from '../services/api.js'          // ← NEW
import {
  generateRoomId,
  generateAccessKey,
  validateRoomId,
  validateKey,
  encodeQRPayload,
  copyToClipboard,
} from '../utils/crypto.js'
import styles from './LoginPage.module.css'

/* ── Icons (unchanged) ────────────────────────── */
function PasteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  )
}
function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function CopyIconButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    const ok = await copyToClipboard(text)
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800) }
  }
  return (
    <button className={`${styles.copyIconBtn} ${copied ? styles.copiedState : ''}`}
      onClick={handle} title="Copy">
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}

function Field({ label, value, onChange, placeholder, error }) {
  const [pasted, setPasted] = useState(false)
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChange({ target: { value: text } })
      setPasted(true)
      setTimeout(() => setPasted(false), 1600)
    } catch { /* silent */ }
  }
  return (
    <div className={styles.fieldWrap}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={`${styles.fieldRow} ${error ? styles.fieldRowError : ''}`}>
        <input
          className={styles.fieldInput}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          className={`${styles.pasteBtn} ${pasted ? styles.pasted : ''}`}
          onClick={handlePaste}
          title="Paste"
          type="button"
        >
          {pasted ? <CheckIcon /> : <PasteIcon />}
        </button>
      </div>
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  )
}

/* ── Main ─────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate()

  // Join state
  const [joinRoom, setJoinRoom]     = useState('')
  const [joinKey, setJoinKey]       = useState('')
  const [joinErrors, setJoinErrors] = useState({})
  const [joinLoading, setJoinLoading] = useState(false)   // ← NEW

  // Generate state
  const [generatedRoom, setGeneratedRoom] = useState('')
  const [generatedKey, setGeneratedKey]   = useState('')
  const [isGenerating, setIsGenerating]   = useState(false)
  const generated = !!(generatedRoom && generatedKey)

  // Error state for API errors                            // ← NEW
  const [apiError, setApiError] = useState('')

  // ── Generate — calls backend now ──────────────────── // ← CHANGED
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setApiError('')

    // Generate credentials client-side (same as before)
    const roomId    = generateRoomId()
    const accessKey = generateAccessKey()

    try {
      // Register the room on the server
      await roomsApi.create(roomId, accessKey)

      // Only set state if server accepted it
      setGeneratedRoom(roomId)
      setGeneratedKey(accessKey)

    } catch (err) {
      // If room ID collision (extremely rare), just try again
      if (err.status === 409) {
        setIsGenerating(false)
        return handleGenerate()
      }
      setApiError('Failed to create room. Check your connection.')
    }

    setIsGenerating(false)
  }, [])

  // ── Join — calls backend now ───────────────────────  // ← CHANGED
  const handleJoin = async () => {
    // Client-side validation first (fast, no network)
    const errors = {}
    if (!joinRoom.trim())               errors.room = 'Room ID is required'
    else if (!validateRoomId(joinRoom)) errors.room = 'Format: NULL-XXXX-XXXX'
    if (!joinKey.trim())                errors.key  = 'Access key is required'
    else if (!validateKey(joinKey))     errors.key  = 'Invalid key format'
    if (Object.keys(errors).length) { setJoinErrors(errors); return }

    setJoinLoading(true)
    setApiError('')

    try {
      // Verify with server — checks room exists + key hash matches
      const data = await roomsApi.join(joinRoom.trim(), joinKey.trim())

      // Pass token to chat page along with credentials
      navigate('/chat', {
        state: {
          roomId:    joinRoom.trim(),
          accessKey: joinKey.trim(),
          token:     data.token,          // ← NEW: JWT for WebSocket auth
        }
      })

    } catch (err) {
      if (err.status === 404) {
        setApiError('Room not found or has expired.')
      } else if (err.status === 401) {
        setApiError('Invalid room ID or access key.')
      } else {
        setApiError('Connection error. Is the server running?')
      }
    }

    setJoinLoading(false)
  }

  // ── Enter generated room ───────────────────────────  // ← CHANGED
  const handleEnterGenerated = () => {
    navigate('/chat', {
      state: {
        roomId:    generatedRoom,
        accessKey: generatedKey,
        // No token here — ChatPage will call join() itself
        // because the creator also needs a participant token
      }
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>

        {/* ══ LEFT ══════════════════════════════════ */}
        <section className={styles.leftPanel}>
          <div className={styles.panelInner}>

            <div className={styles.brandRow}>
              <Logo size="lg" />
            </div>

            <h1 className={styles.heading}>Private chat,<br />without the noise.</h1>
            <p className={styles.subheading}>
              Join a room with a key, or generate a new one in seconds.
              Designed to feel clean, fast, and secure.
            </p>

            <div className={styles.formCard}>
              <span className={styles.sectionLabel}>Join a room</span>

              <div className={styles.fieldGroup}>
                <Field
                  label="Room ID"
                  value={joinRoom}
                  onChange={(e) => {
                    setJoinRoom(e.target.value.toUpperCase())
                    setJoinErrors((p) => ({ ...p, room: '' }))
                    setApiError('')
                  }}
                  placeholder="NULL-XXXX-XXXX"
                  error={joinErrors.room}
                />
                <Field
                  label="Access Key"
                  value={joinKey}
                  onChange={(e) => {
                    setJoinKey(e.target.value.toLowerCase())
                    setJoinErrors((p) => ({ ...p, key: '' }))
                    setApiError('')
                  }}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxxxxxx"
                  error={joinErrors.key}
                />
              </div>

              {/* API error shown here */}
              {apiError && (
                <p style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  marginBottom: '8px',
                  paddingLeft: '2px'
                }}>
                  {apiError}
                </p>
              )}

              <button
                className={styles.btnPrimary}
                onClick={handleJoin}
                disabled={joinLoading}
              >
                {joinLoading ? 'Verifying…' : 'Enter Room →'}
              </button>
            </div>

            <div className={styles.pageFooter}>
              <span className={styles.statusDot} />
              Encrypted · No logs · Instant join
            </div>

          </div>
        </section>

        {/* ══ RIGHT ══════════════════════════════════ */}
        <section className={styles.rightPanel}>
          <div className={styles.panelInner}>

            <div className={styles.brandRowSpacer}>
              <Logo size="lg" />
            </div>

            {!generated && (
              <>
                <h2 className={styles.headingDark}>Generate<br />and share.</h2>
                <p className={styles.subheadingDark}>
                  Create a fresh room in one click — your Room ID, key,
                  and QR code appear instantly.
                </p>
                <div className={styles.boxDark}>
                  <span className={styles.boxLabelDark}>Create a room</span>

                  {/* API error for generate */}
                  {apiError && (
                    <p style={{
                      fontSize: '12px',
                      color: '#fca5a5',
                      paddingLeft: '2px'
                    }}>
                      {apiError}
                    </p>
                  )}

                  <button
                    className={styles.btnPrimary}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating
                      ? <><span className={styles.spinner} />Generating…</>
                      : 'Generate Room & Key'
                    }
                  </button>
                </div>
              </>
            )}

            {generated && (
              <>
                <div className={styles.resultBox}>
                  <div className={styles.qrSection}>
                    <span className={styles.qrScanLabel}>Scan to join</span>
                    <div className={styles.qrCanvas}>
                      <QRCodeSVG
                        value={encodeQRPayload(generatedRoom, generatedKey)}
                        size={148}
                        bgColor="transparent"
                        fgColor="rgba(255,255,255,0.85)"
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                  <div className={styles.credRows}>
                    <div className={styles.credRow}>
                      <div className={styles.credInfo}>
                        <span className={styles.credTag}>Room ID</span>
                        <span className={styles.credValue}>{generatedRoom}</span>
                      </div>
                      <CopyIconButton text={generatedRoom} />
                    </div>
                    <div className={styles.credRow}>
                      <div className={styles.credInfo}>
                        <span className={styles.credTag}>Access Key</span>
                        <span className={styles.credValueSub}>{generatedKey}</span>
                      </div>
                      <CopyIconButton text={generatedKey} />
                    </div>
                  </div>
                </div>

                <div className={styles.resultActions}>
                  <button className={styles.btnPrimary} onClick={handleEnterGenerated}>
                    Enter Room →
                  </button>
                  <button
                    className={styles.regenBtn}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Regenerating…' : 'Regenerate credentials'}
                  </button>
                </div>
              </>
            )}

            <div className={styles.pageFooterDark}>
              <span className={styles.statusDot} />
              Share key only with trusted people
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}