import { useId, useState } from 'react'
import styles from './Toolbar.module.css'
import { Button } from '../Button'
import { IconButton } from '../IconButton'

type Props = {
  onSearch?: (value: string) => void
  onToggleEmpty?: (value: boolean) => void
  onExportCsv?: () => void
  ColumnVisibilityMenu?: React.ComponentType
}

export default function Toolbar({ onSearch, onToggleEmpty, onExportCsv, ColumnVisibilityMenu }: Props) {
  const [query, setQuery] = useState('')
  const [showEmpty, setShowEmpty] = useState(true)
  const inputId = useId()

  return (
    <div className={styles.toolbar}>
      <label htmlFor={inputId} style={{ display: 'none' }}>חיפוש</label>
      <input
        id={inputId}
        className={styles.input}
        placeholder="חיפוש..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onSearch?.(e.target.value)
        }}
      />
      <IconButton
        aria-pressed={!showEmpty}
        onClick={() => {
          const next = !showEmpty
          setShowEmpty(next)
          onToggleEmpty?.(next)
        }}
        title="הצג/הסתר עמודות ריקות"
      >
        ☐
      </IconButton>
      <Button onClick={onExportCsv}>ייצוא CSV</Button>
      {ColumnVisibilityMenu ? <ColumnVisibilityMenu /> : null}
      <div className={styles.spacer} />
    </div>
  )
}

