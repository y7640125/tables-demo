import type { InputHTMLAttributes } from 'react'
import styles from './BooleanField.module.css'

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked' | 'type' | 'value'>
type Props = BaseInputProps & {
  label: string
  name: string
  value: boolean
  onChange: (value: boolean) => void
}

export default function BooleanField({ label, name, value, onChange, className, ...rest }: Props) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className={`${styles.input} ${className || ''}`}
          {...rest}
        />
        <span className={styles.labelText}>{label}</span>
      </label>
    </div>
  )
}

