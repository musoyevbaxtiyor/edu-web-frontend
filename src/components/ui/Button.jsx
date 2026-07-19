import { Loader2 } from 'lucide-react'
import { cx } from '../../lib/utils'

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
  outline: 'btn-outline',
}

export default function Button({
  as: Comp = 'button',
  variant = 'primary',
  size,
  block,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}) {
  return (
    <Comp
      className={cx('btn', VARIANTS[variant], size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', block && 'btn-block', className)}
      disabled={Comp === 'button' ? disabled || loading : undefined}
      aria-disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="spin" style={{ animation: 'spin 0.7s linear infinite' }} />}
      {children}
    </Comp>
  )
}
