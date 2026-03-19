import styles from './ChatBubble.module.css'

export default function ChatBubble({ message }) {
  if (message.isSystem) {
    return (
      <div className={styles.system}>
        <span className={styles.systemDot} />
        <span className={styles.systemText}>{message.text}</span>
        <span className={styles.time}>{message.time}</span>
      </div>
    )
  }

  return (
    <div className={`${styles.wrapper} ${message.isOwn ? styles.own : styles.other}`}>
      {!message.isOwn && (
        <div className={styles.avatar}>
          {message.sender.charAt(0).toUpperCase()}
        </div>
      )}
      <div className={styles.bubble}>
        {!message.isOwn && (
          <span className={styles.sender}>{message.sender}</span>
        )}
        <p className={styles.text}>{message.text}</p>
        <span className={styles.time}>{message.time}</span>
      </div>
    </div>
  )
}
