import type { FieldModel } from '../types'
import styles from './GenericField.module.css'

interface GenericFieldProps {
  model: FieldModel<string | boolean | Date>
  /** true => render input; false => render formatted value */
  edit: boolean
  /** called with the next raw value (string | boolean | Date) */
  onChange?: (next: any) => void
  /** optional id override */
  id?: string
  /** optional className to wrap */
  className?: string
  /** hide the label (useful for table cells) */
  hideLabel?: boolean
  /** when true, apply text ellipsis to the displayed value (only in read-only mode) */
  truncate?: boolean
}

export default function GenericField(props: GenericFieldProps): JSX.Element {
  const { model, edit, onChange, id, className, hideLabel = false, truncate = false } = props
  const fieldId = id ?? `field-${model.name}`

  const handleChange = (nextValue: string | boolean) => {
    if (onChange) {
      if (model.type === 'date') {
        onChange(nextValue as string)
      } else {
        onChange(nextValue)
      }
    }
  }

  const formatValue = (): string => {
    if (model.type === 'boolean') {
      return model.value ? 'כן' : 'לא'
    }
    if (model.type === 'date') {
      const dateValue = model.value as string
      if (!dateValue) return ''
      try {
        const date = new Date(dateValue)
        return date.toLocaleDateString('he-IL')
      } catch {
        return dateValue
      }
    }
    return String(model.value || '')
  }

  return (
    <div className={`${styles.field} ${className || ''}`}>
      {!hideLabel && (
        <label htmlFor={fieldId} className={styles.label}>
          {model.label}
        </label>
      )}
      {edit ? (
        <>
          {model.type === 'text' && (
            <input
              id={fieldId}
              type="text"
              value={model.value as string}
              onChange={(e) => handleChange(e.target.value)}
              className={styles.control}
              aria-invalid={!model.value}
            />
          )}
          {model.type === 'date' && (
            <input
              id={fieldId}
              type="date"
              value={model.value as string}
              onChange={(e) => handleChange(e.target.value)}
              className={styles.control}
              aria-invalid={!model.value}
            />
          )}
          {model.type === 'boolean' && (
            <div>
              <input
                id={fieldId}
                type="checkbox"
                checked={model.value as boolean}
                onChange={(e) => handleChange(e.target.checked)}
                className={styles.checkbox}
                aria-invalid={false}
              />
            </div>
          )}
          {model.type === 'textarea' && (
            <textarea
              id={fieldId}
              rows={4}
              value={model.value as string}
              onChange={(e) => handleChange(e.target.value)}
              className={styles.control}
              aria-invalid={!model.value}
            />
          )}
          {model.type === 'enum' && (
            <select
              id={fieldId}
              value={model.value as string}
              onChange={(e) => handleChange(e.target.value)}
              className={styles.control}
              aria-invalid={!model.value}
            >
              {model.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </>
      ) : (() => {
        const formattedValue = formatValue();
        const valueContent = formattedValue ? formattedValue : <i style={{ opacity: 0.5 }}>לא הוזן</i>;
        
        if (truncate) {
          return (
            <div className={styles.ellipsisTextContainer}>
              <div className={styles.ellipsisText}>
                <div className={styles.value}>
                  {valueContent}
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div className={styles.value}>
            {valueContent}
          </div>
        );
      })()}
    </div>
  )
}

