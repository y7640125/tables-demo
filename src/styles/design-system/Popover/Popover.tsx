import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import styles from './Popover.module.css'

type Props = PropsWithChildren<{
  anchor: HTMLElement | null
  open: boolean
  onClose: () => void
}>

export default function Popover({ anchor, open, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current || !open) return
      if (ref.current.contains(e.target as Node)) return
      if (anchor && anchor.contains(e.target as Node)) return
      onClose()
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open, onClose, anchor])

  useEffect(() => {
    if (!anchor || !open) return
    const rect = anchor.getBoundingClientRect()
    setPos({ top: rect.bottom + window.scrollY + 6, left: rect.right + window.scrollX - 200 })
  }, [anchor, open])

  if (!open) return null
  return (
    <div
      ref={ref}
      className={styles.popover}
      style={{ top: pos.top, left: pos.left }}
      role="dialog"
      aria-hidden={!open}
    >
      {children}
    </div>
  )
}

