import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import clsx from 'clsx'
import styles from './IconButton.module.css'

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement>
>

export default function IconButton({ className, children, ...rest }: Props) {
  return (
    <button className={clsx(styles.iconButton, className)} {...rest}>
      {children}
    </button>
  )
}


