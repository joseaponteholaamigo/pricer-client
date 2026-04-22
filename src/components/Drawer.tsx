import { useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface DrawerProps {
  isOpen: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export default function Drawer({ isOpen, title, subtitle, onClose, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="absolute right-0 top-0 h-full flex flex-col border-l border-p-border"
        style={{
          width: 'min(480px, 100vw)',
          background: '#111314',
          animation: 'slideInRight 200ms ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-p-border">
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-p-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-p-muted hover:text-white transition-colors ml-4 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-p-border">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>,
    document.body,
  )
}
