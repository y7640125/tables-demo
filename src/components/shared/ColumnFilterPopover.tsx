import React, { useEffect, useRef, useState } from 'react';
import styles from './ColumnFilterPopover.module.css';

interface ColumnFilterPopoverProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  values: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}

export default function ColumnFilterPopover({
  anchor,
  open,
  onClose,
  values,
  selected,
  onToggle,
  onClear,
}: ColumnFilterPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current || !open) return;
      if (ref.current.contains(e.target as Node)) return;
      if (anchor && anchor.contains(e.target as Node)) return;
      onClose();
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, onClose, anchor]);

  useEffect(() => {
    if (!anchor || !open) return;
    const rect = anchor.getBoundingClientRect();
    setPos({ top: rect.bottom + window.scrollY + 6, left: rect.right + window.scrollX - 200 });
  }, [anchor, open]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={styles.popover}
      style={{ 
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        zIndex: 1000,
      }}
      role="dialog"
      aria-hidden={!open}
    >
      <div className={`${styles.popoverContent} filter-dropdown`}>
        <div className={styles.header}>
          <span>סינון</span>
          <button onClick={onClear} className={styles.clearButton}>
            נקה סינון
          </button>
        </div>
        <div className={styles.checkboxList}>
          {values.map((value) => (
            <label key={value} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={selected.has(value)}
                onChange={() => onToggle(value)}
              />
              <span>{value || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>לא הוזן</span>}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
