import { useState } from 'react'
import styles from './Input.module.css'

export default function Input({
  label,
  value,
  onChange,
  placeholder,
  error,
  mono = false,
  readOnly = false,
  suffix,
  ...props
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label}>
          <span className={styles.labelDot} />
          {label}
        </label>
      )}
      <div className={`${styles.inputWrap} ${focused ? styles.focused : ''} ${error ? styles.errored : ''} ${readOnly ? styles.readonly : ''}`}>
        <input
          className={`${styles.input} ${mono ? styles.mono : ''}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {suffix && <div className={styles.suffix}>{suffix}</div>}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
