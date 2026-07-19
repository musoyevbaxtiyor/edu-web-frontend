const GRADIENTS = {
  brand: 'var(--grad-brand)',
  sunset: 'var(--grad-sunset)',
  mint: 'var(--grad-mint)',
  info: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  gold: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
}

export default function StatCard({ icon: Icon, value, label, tone = 'brand', hint }) {
  return (
    <div className="stat card-hover">
      <div className="stat-icon" style={{ background: GRADIENTS[tone] || GRADIENTS.brand }}>
        {Icon && <Icon />}
      </div>
      <div className="grow">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="text-muted" style={{ fontSize: '.74rem', marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  )
}
