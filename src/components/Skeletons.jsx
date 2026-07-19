export function CardSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 128, borderRadius: 0 }} />
      <div className="card-pad stack gap-3">
        <div className="skeleton" style={{ height: 18, width: '70%' }} />
        <div className="skeleton" style={{ height: 12, width: '100%' }} />
        <div className="skeleton" style={{ height: 12, width: '85%' }} />
        <div className="skeleton" style={{ height: 40, width: '100%', marginTop: 8 }} />
      </div>
    </div>
  )
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )
}

export function RowsSkeleton({ rows = 5 }) {
  return (
    <div className="stack gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 56 }} />
      ))}
    </div>
  )
}

export function StatsSkeleton({ count = 4 }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 92, borderRadius: 'var(--r-lg)' }} />
      ))}
    </div>
  )
}
