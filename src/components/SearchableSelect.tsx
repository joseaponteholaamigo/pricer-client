import { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, X } from 'lucide-react'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  clearLabel?: string
  className?: string
  'aria-label'?: string
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  clearLabel = 'Todas',
  className = '',
  'aria-label': ariaLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const selected = options.find(o => o.value === value)

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function handleSelect(optValue: string) {
    onChange(optValue)
    setOpen(false)
    setQuery('')
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setOpen(false)
    setQuery('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel ?? placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(o => !o)}
        className="glass-select flex items-center justify-between gap-2 min-w-[160px] text-left"
      >
        <span className={selected ? 'text-white' : 'text-p-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {value && (
            <X
              size={13}
              className="text-p-muted hover:text-white transition-colors"
              onClick={handleClear}
              aria-label="Limpiar selección"
            />
          )}
          <ChevronDown
            size={14}
            className={`text-p-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[200px] glass-panel rounded-xl shadow-glass overflow-hidden"
          style={{ maxHeight: 280 }}
        >
          <div className="p-2 border-b border-p-border">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar..."
              className="w-full bg-transparent text-sm text-white placeholder-p-muted outline-none px-2 py-1"
              aria-label="Buscar en opciones"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="overflow-y-auto"
            style={{ maxHeight: 220 }}
          >
            <li
              role="option"
              aria-selected={value === ''}
              onClick={() => handleSelect('')}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                value === ''
                  ? 'text-p-lime bg-p-lime/10'
                  : 'text-p-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {clearLabel}
            </li>
            {filtered.map(opt => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => handleSelect(opt.value)}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  opt.value === value
                    ? 'text-p-lime bg-p-lime/10'
                    : 'text-white hover:bg-white/5'
                }`}
              >
                {opt.label}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-p-muted text-center">
                Sin resultados
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
