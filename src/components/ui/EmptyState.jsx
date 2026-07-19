import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = "Ma'lumot yo'q", message, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon /></div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}
