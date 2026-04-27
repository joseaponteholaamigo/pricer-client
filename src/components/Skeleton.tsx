// ─── Skeleton primitivo ───────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
}

function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-white/10 rounded-lg ${className}`}
    />
  )
}

export default Skeleton

// ─── Fila de tabla skeleton ───────────────────────────────────────────────────

export function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton className="h-4 w-3/4" />
        </td>
      ))}
    </tr>
  )
}

// ─── Tabla completa skeleton ──────────────────────────────────────────────────

export function SkeletonTable({ rows = 5, columns }: { rows?: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </>
  )
}

// ─── Bloque de KPI cards skeleton ────────────────────────────────────────────

export function SkeletonKpiCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-5`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel p-5 space-y-3">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}
