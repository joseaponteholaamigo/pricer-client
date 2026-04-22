import { Search } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder = 'Buscar producto, marca o SKU...' }: SearchInputProps) {
  return (
    <div className="relative" style={{ width: 280 }}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-p-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="glass-input pl-8 w-full text-sm"
      />
    </div>
  )
}
