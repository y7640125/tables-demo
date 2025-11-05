import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './Button.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default'
}

export default function Button({ className, variant = 'default', ...rest }: Props) {
  return <button className={clsx(styles.button, className)} {...rest} />
}


