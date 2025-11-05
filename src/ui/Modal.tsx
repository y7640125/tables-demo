import { useEffect, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

type Props = PropsWithChildren<{
  open: boolean
  onClose: () => void
}>

export default function Modal({ open, onClose, children }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className={styles.modal} role="dialog" aria-modal="true">
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.content}>{children}</div>
    </div>,
    document.body
  )
}


