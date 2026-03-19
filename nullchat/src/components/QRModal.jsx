import { useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { encodeQRPayload } from '../utils/crypto.js'
import CopyButton from './CopyButton.jsx'
import styles from './QRModal.module.css'

export default function QRModal({ roomId, accessKey, onClose }) {
  const payload = encodeQRPayload(roomId, accessKey)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Share Room</h2>
            <p className={styles.sub}>Scan to join this encrypted room</p>
          </div>
          <button className={styles.close} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.qrWrap}>
          <div className={styles.qrFrame}>
            <QRCodeSVG
              value={payload}
              size={200}
              bgColor="transparent"
              fgColor="#00c8ff"
              level="M"
              includeMargin={false}
            />
            <div className={styles.corner} data-pos="tl" />
            <div className={styles.corner} data-pos="tr" />
            <div className={styles.corner} data-pos="bl" />
            <div className={styles.corner} data-pos="br" />
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>ROOM ID</span>
            <div className={styles.detailValue}>
              <span className={styles.mono}>{roomId}</span>
              <CopyButton text={roomId} />
            </div>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>ACCESS KEY</span>
            <div className={styles.detailValue}>
              <span className={`${styles.mono} ${styles.keyText}`}>{accessKey}</span>
              <CopyButton text={accessKey} />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.warning}>
            <span className={styles.warningDot} />
            Never share this key over insecure channels
          </p>
        </div>
      </div>
    </div>
  )
}
