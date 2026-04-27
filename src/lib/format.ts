const copFmt = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const numFmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

export function fmtCOP(value: number): string {
  return copFmt.format(Math.round(value))
}

export function fmtNum(value: number): string {
  return numFmt.format(Math.round(value))
}

export function fmtPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}
