import { Link } from 'react-router-dom'

export default function Logo({ to = '/', compact = false }) {
  return (
    <Link to={to} className="row gap-2" style={{ textDecoration: 'none' }} aria-label="Edu Web">
      <span
        className="center"
        style={{
          width: 38, height: 38, borderRadius: 12, background: 'var(--grad-brand)',
          color: '#fff', boxShadow: 'var(--shadow-brand)', flexShrink: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M32 16 L52 26 L32 36 L12 26 Z" fill="#fff" />
          <path d="M20 31 L20 42 C20 46 26 49 32 49 C38 49 44 46 44 42 L44 31 L32 37 Z" fill="#fff" opacity="0.8" />
          <rect x="50" y="26" width="2.6" height="14" rx="1.3" fill="#fff" />
        </svg>
      </span>
      {!compact && (
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
          Edu<span className="text-gradient">Web</span>
        </span>
      )}
    </Link>
  )
}
