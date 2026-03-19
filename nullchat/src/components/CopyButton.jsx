import { useState } from 'react'
import { copyToClipboard } from '../utils/crypto.js'
import styles from './CopyButton.module.css'

export default function CopyButton({ text, label = '', dark = false }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const base = dark ? styles.btnDark : styles.btn

  return (
    <button
      className={`${base} ${copied ? styles.copied : ''}`}
      onClick={handleCopy}
      title={`Copy ${label}`}
    >
      {copied ? <><CheckIcon /><span>copied</span></> : <><CopyIcon />{label && <span>{label}</span>}</>}
    </button>
  )
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
