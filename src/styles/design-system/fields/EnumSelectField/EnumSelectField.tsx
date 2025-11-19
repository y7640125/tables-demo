import type { SelectHTMLAttributes } from 'react'
import styles from './EnumSelectField.module.css'

type Option = {
  value: string
  label: string
}

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> & {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  options: Option[]
}

export default function EnumSelectField({ label, name, value, onChange, options, className, ...rest }: Props) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${styles.input} ${className || ''}`}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

