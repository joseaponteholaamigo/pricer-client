import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10" style={{ minHeight: 160 }}>
      {Icon && <Icon size={24} className="text-p-muted opacity-50" />}
      <p className="text-[15px] font-medium text-p-gray-light">{title}</p>
      <p className="text-[13px] text-p-muted text-center max-w-xs">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-1 text-sm px-4 py-2">
          {action.label}
        </button>
      )}
    </div>
  )
}
