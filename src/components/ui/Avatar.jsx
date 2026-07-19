import { initials, cx } from '../../lib/utils'

export default function Avatar({ name, src, size = 'md', className, style }) {
  const cls = cx('avatar', size === 'sm' && 'avatar-sm', size === 'lg' && 'avatar-lg', size === 'xl' && 'avatar-xl', className)
  return (
    <span className={cls} style={style} title={name}>
      {src ? <img src={src} alt={name || ''} /> : initials(name)}
    </span>
  )
}
