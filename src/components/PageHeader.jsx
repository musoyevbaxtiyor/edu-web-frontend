export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-head between wrap gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="row gap-2 wrap">{actions}</div>}
    </div>
  )
}
