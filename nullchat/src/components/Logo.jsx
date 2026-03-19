import styles from './Logo.module.css'
import logoImg from '../assets/logo.png'

export default function Logo({ size = 'md' }) {
  return (
    <div className={`${styles.logo} ${styles[size]}`}>
      <div className={styles.icon}>
        <img src={logoImg} alt="nullChat logo" />
      </div>

      <div className={styles.wordmark}>
        <span className={styles.null}>null</span>
        <span className={styles.chat}>Chat</span>
      </div>
    </div>
  )
}