import { useState, useMemo, Dispatch, SetStateAction } from 'react'

export function useTableSearch<T>(
  data: T[],
  keys: (keyof T)[],
): [T[], string, Dispatch<SetStateAction<string>>] {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return data
    return data.filter(item =>
      keys.some(key => {
        const val = item[key]
        return val != null && String(val).toLowerCase().includes(term)
      })
    )
  }, [data, keys, searchTerm])

  return [filtered, searchTerm, setSearchTerm]
}
