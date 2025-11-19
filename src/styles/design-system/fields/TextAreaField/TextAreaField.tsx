import type { TextareaHTMLAttributes } from 'react'
import styles from './TextAreaField.module.css'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
}

export default function TextAreaField({ label, name, value, onChange, className, ...rest }: Props) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${styles.input} ${className || ''}`}
        {...rest}
      />
    </div>
  )
}

