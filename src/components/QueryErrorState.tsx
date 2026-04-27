import { AlertTriangle } from 'lucide-react'

interface QueryErrorStateProps {
  onRetry: () => void
  message?: string
  className?: string
}

function QueryErrorState({
  onRetry,
  message = 'No se pudieron cargar los datos.',
  className = '',
}: QueryErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 py-10 text-center ${className}`}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-p-red/10 border border-p-red/20">
        <AlertTriangle size={22} className="text-p-red" aria-hidden="true" />
      </div>
      <p className="text-sm text-white/80 font-medium">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 rounded-lg text-xs font-semibold bg-p-lime/20 text-p-lime border border-p-lime/30
                   hover:bg-p-lime/30 transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-p-lime/50"
      >
        Reintentar
      </button>
    </div>
  )
}

export default QueryErrorState
