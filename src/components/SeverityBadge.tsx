import { AlertTriangle } from 'lucide-react'

interface SeverityBadgeProps {
  value: number
  suffix?: string
}

export default function SeverityBadge({ value, suffix = '%' }: SeverityBadgeProps) {
  const abs = Math.abs(value)
  const isCritical = abs > 10
  const isWarning = abs > 3

  const cls = isCritical ? 'badge badge-red' : isWarning ? 'badge badge-yellow' : 'badge badge-green'
  const sign = value > 0 ? '+' : ''

  return (
    <span className={cls}>
      {isCritical && <AlertTriangle size={11} />}
      {sign}{value.toFixed(1)}{suffix}
    </span>
  )
}
