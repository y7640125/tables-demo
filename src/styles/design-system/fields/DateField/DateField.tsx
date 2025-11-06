import type { InputHTMLAttributes } from 'react'
import styles from './DateField.module.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
}

export default function DateField({ label, name, value, onChange, className, ...rest }: Props) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${styles.input} ${className || ''}`}
        {...rest}
      />
    </div>
  )
}

