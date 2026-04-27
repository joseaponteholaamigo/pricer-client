import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, BarChart3, TrendingDown, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import type { ElasticidadKpis, ElasticidadSummaryRow, SkuElasticidadDetail } from '../lib/types'
import Drawer from '../components/Drawer'
import { SkeletonKpiCards, SkeletonTable } from '../components/Skeleton'
import QueryErrorState from '../components/QueryErrorState'

export default function ElasticidadPage() {
  const [marca, setMarca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [drawerSkuId, setDrawerSkuId] = useState<string | null>(null)
  const [drawerRow, setDrawerRow] = useState<ElasticidadSummaryRow | null>(null)

  const { data: filterOptions } = useQuery({
    queryKey: ['elasticidad-filters'],
    queryFn: () => api.get<{ marcas: string[]; categorias: string[] }>('/elasticidad/filters').then(r => r.data),
  })

  const filters = `marca=${marca}&categoria=${categoria}`

  const handleSkuClick = (skuId: string, row: ElasticidadSummaryRow) => {
    setDrawerSkuId(skuId)
    setDrawerRow(row)
  }

  return (
    <div>
      {/* Filters row */}
      <div className="flex items-center gap-4 mb-6">
        <select value={marca} onChange={(e) => setMarca(e.target.value)} className="glass-select">
          <option value="">Todas las marcas</option>
          {filterOptions?.marcas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="glass-select">
          <option value="">Todas las categorías</option>
          {filterOptions?.categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <ResumenTab filters={filters} onSkuClick={handleSkuClick} />

      <Drawer
        isOpen={!!drawerSkuId}
        title={drawerRow?.nombre ?? ''}
        subtitle={drawerRow ? `Elasticidad: ${drawerRow.coeficiente.toFixed(2)} · ${drawerRow.codigoSku} · ${drawerRow.marca}` : undefined}
        onClose={() => { setDrawerSkuId(null); setDrawerRow(null) }}
      >
        {drawerSkuId && <SimuladorContent skuId={drawerSkuId} />}
      </Drawer>
    </div>
  )
}

// ─── Resumen Tab ─────────────────────────────────────────────

function ResumenTab({ filters, onSkuClick }: { filters: string; onSkuClick: (skuId: string, row: ElasticidadSummaryRow) => void }) {
  const { data: kpis, isLoading: kpisLoading, isError: kpisError, refetch: refetchKpis } = useQuery({
    queryKey: ['elasticidad-kpis', filters],
    queryFn: () => api.get<ElasticidadKpis>(`/elasticidad/kpis?${filters}`).then(r => r.data),
  })

  const { data: rows = [], isLoading: rowsLoading, isError: rowsError, refetch: refetchRows } = useQuery({
    queryKey: ['elasticidad-summary', filters],
    queryFn: () => api.get<ElasticidadSummaryRow[]>(`/elasticidad/summary?${filters}`).then(r => r.data),
  })

  if (kpisLoading || rowsLoading) {
    return (
      <div className="space-y-6">
        <SkeletonKpiCards count={4} />
        <div className="glass-panel overflow-x-auto">
          <table className="data-table">
            <tbody><SkeletonTable rows={8} columns={6} /></tbody>
          </table>
        </div>
      </div>
    )
  }

  if (kpisError || rowsError) {
    return (
      <div className="glass-panel">
        <QueryErrorState
          onRetry={() => { void refetchKpis(); void refetchRows() }}
          message="No se pudo cargar el análisis de elasticidad."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-5">
        <KpiCard
          label="SKUs con Elasticidad"
          value={String(kpis?.totalSkusConElasticidad ?? 0)}
          icon={Activity}
          color="text-p-blue"
          sub={`${kpis?.totalSkusConElasticidad ?? 0} de ${(kpis as unknown as { totalSkus?: number })?.totalSkus ?? '—'} productos activos`}
          subColor="text-p-muted"
        />
        <KpiCard
          label="Elasticidad promedio"
          value={String(kpis?.coeficientePromedio ?? 0)}
          icon={TrendingDown}
          color="text-p-yellow"
          sub="A mayor valor absoluto, más sensible al precio"
          subColor="text-p-muted"
        />
        <KpiCard
          label="Producto más sensible al precio"
          value={kpis?.skuMasElastico?.nombre ?? '—'}
          icon={BarChart3}
          color="text-p-red"
          sub={kpis?.skuMasElastico ? `Elasticidad ${kpis.skuMasElastico.coeficiente}` : undefined}
          subColor="text-p-red"
        />
      </div>

      {/* Summary subtitle */}
      <p className="text-p-muted text-sm">
        Proyección con un alza de +5% en precio. Haz clic en un producto para ajustar el porcentaje.
      </p>

      {/* Summary Table */}
      <div className="glass-panel overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th className="text-right">Unidades base</th>
              <th className="text-right">Elasticidad</th>
              <th className="text-right">Precio recomendado</th>
              <th className="text-right">Precio actual</th>
              <th className="text-right">Impacto en volumen</th>
              <th className="text-right">Impacto en ingresos</th>
              <th className="text-right">Impacto en margen</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const maxVol = Math.max(...rows.map(r => Math.abs(r.impactoVolumenPct)), 0.01)
              const maxIng = Math.max(...rows.map(r => Math.abs(r.impactoIngresosPct)), 0.01)
              const maxMar = Math.max(...rows.map(r => Math.abs(r.impactoMargenPct)), 0.01)
              return rows.map(r => (
              <tr
                key={r.skuId}
                className="cursor-pointer hover:bg-p-bg-hover transition-colors"
                onClick={() => onSkuClick(r.skuId, r)}
              >
                <td>
                  <div className="font-medium">{r.nombre}</div>
                  <div className="text-p-muted text-xs">{r.codigoSku} · {r.marca}</div>
                </td>
                <td className="text-right">{r.volumenBase.toLocaleString('es-CO')}</td>
                <td className="text-right">{r.coeficiente.toFixed(2)}</td>
                <td className="text-right text-p-lime">
                  {r.precioRecomendado != null ? `$${r.precioRecomendado.toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : '—'}
                </td>
                <td className="text-right">${r.precioActual.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                <td className="text-right">
                  <SparkCell value={r.impactoVolumenPct} maxAbs={maxVol} />
                </td>
                <td className="text-right">
                  <SparkCell value={r.impactoIngresosPct} maxAbs={maxIng} />
                </td>
                <td className="text-right">
                  <SparkCell value={r.impactoMargenPct} maxAbs={maxMar} />
                </td>
              </tr>
              ))
            })()}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-p-muted py-8">
                  No hay SKUs con elasticidad configurada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Simulador Content (Drawer) ──────────────────────────────

function SimuladorContent({ skuId }: { skuId: string }) {
  const [sliderValue, setSliderValue] = useState(0)

  const { data: detail, isLoading, isError, refetch } = useQuery({
    queryKey: ['elasticidad-sku', skuId],
    queryFn: () => api.get<SkuElasticidadDetail>(`/elasticidad/sku/${skuId}`).then(r => r.data),
    enabled: !!skuId,
  })

  useEffect(() => { setSliderValue(0) }, [skuId])

  if (isLoading) {
    return (
      <div className="space-y-4 p-4" aria-hidden="true">
        <div className="animate-pulse bg-white/10 rounded-lg h-5 w-1/2" />
        <div className="animate-pulse bg-white/10 rounded-lg h-28 w-full" />
        <div className="animate-pulse bg-white/10 rounded-lg h-5 w-3/4" />
        <div className="animate-pulse bg-white/10 rounded-lg h-40 w-full" />
      </div>
    )
  }

  if (isError) {
    return <QueryErrorState onRetry={refetch} message="No se pudo cargar el detalle de elasticidad." />
  }

  if (!detail) {
    return (
      <div className="glass-panel p-12 text-center text-p-muted">
        <AlertTriangle size={48} className="mx-auto mb-4 opacity-40" />
        <p className="text-lg">No se encontró elasticidad para este SKU</p>
      </div>
    )
  }

  // ─── Calculations (client-side) ───
  const precioPct = sliderValue / 100
  const precioSimulado = detail.precioActual * (1 + precioPct)
  const cambioVolPct = detail.coeficiente * precioPct
  const nuevoVolumen = Math.max(0, detail.volumenBase * (1 + cambioVolPct))
  const volumenDelta = nuevoVolumen - detail.volumenBase
  const volumenDeltaPct = detail.volumenBase > 0 ? (volumenDelta / detail.volumenBase) * 100 : 0

  const ingresosActuales = detail.precioActual * detail.volumenBase
  const ingresosSimulados = precioSimulado * nuevoVolumen
  const ingresosDelta = ingresosSimulados - ingresosActuales
  const ingresosDeltaPct = ingresosActuales > 0 ? (ingresosDelta / ingresosActuales) * 100 : 0

  const margenActual = (detail.precioActual - detail.costoVariable) * detail.volumenBase
  const margenSimulado = (precioSimulado - detail.costoVariable) * nuevoVolumen
  const margenDelta = margenSimulado - margenActual
  const margenDeltaPct = margenActual > 0 ? (margenDelta / margenActual) * 100 : 0

  const margenNegativo = margenSimulado < 0

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {margenNegativo && sliderValue !== 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-sm">
            El margen proyectado es negativo — El precio simulado no cubre el costo variable
          </span>
        </div>
      )}

      {/* Base Data Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="glass-panel p-5">
          <p className="text-sm text-p-muted mb-1">Volumen Base</p>
          <p className="text-2xl font-bold text-p-text">{detail.volumenBase.toLocaleString('es-CO')} uds</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-sm text-p-muted mb-1">Precio Actual</p>
          <p className="text-2xl font-bold text-p-text">${detail.precioActual.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-sm text-p-muted mb-1">Coeficiente de Elasticidad</p>
          <p className="text-2xl font-bold text-p-yellow">{detail.coeficiente.toFixed(2)}</p>
        </div>
      </div>

      {/* Price Slider */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-p-gray-light">Ajuste de Precio</h3>
          <div className="text-right">
            <span className="text-2xl font-bold text-p-text">
              ${precioSimulado.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </span>
            <span className={`ml-2 text-sm font-medium ${sliderValue >= 0 ? 'text-p-lime' : 'text-p-red'}`}>
              ({sliderValue >= 0 ? '+' : ''}{sliderValue}%)
            </span>
          </div>
        </div>
        <input
          type="range"
          min={-50}
          max={50}
          step={1}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full accent-p-lime h-2 bg-p-border rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-xs text-p-muted mt-2">
          <span>-50%</span>
          <span className="cursor-pointer hover:text-p-text" onClick={() => setSliderValue(0)}>0%</span>
          <span>+50%</span>
        </div>
      </div>

      {/* Result Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Volumen */}
        <div className="glass-panel p-5">
          <p className="text-sm text-p-muted mb-2">Volumen Proyectado</p>
          <p className={`text-2xl font-bold ${volumenDelta >= 0 ? 'text-p-lime' : 'text-p-red'}`}>
            {Math.round(nuevoVolumen).toLocaleString('es-CO')} uds
          </p>
          {sliderValue !== 0 && (
            <p className={`text-sm mt-1 ${volumenDelta >= 0 ? 'text-p-lime' : 'text-p-red'}`}>
              {volumenDelta >= 0 ? '+' : ''}{Math.round(volumenDelta).toLocaleString('es-CO')} uds ({volumenDeltaPct >= 0 ? '+' : ''}{volumenDeltaPct.toFixed(1)}%)
            </p>
          )}
          {sliderValue !== 0 && detail.coeficiente === 0 && (
            <p className="text-xs text-p-muted mt-1">Elasticidad = 0 — Volumen no cambia</p>
          )}
        </div>

        {/* Ingresos */}
        <div className="glass-panel p-5">
          <p className="text-sm text-p-muted mb-2">Ingresos Proyectados</p>
          <p className={`text-2xl font-bold ${ingresosDelta >= 0 ? 'text-p-lime' : 'text-p-red'}`}>
            {formatMillones(ingresosSimulados)}
          </p>
          {sliderValue !== 0 && (
            <p className={`text-sm mt-1 ${ingresosDelta >= 0 ? 'text-p-lime' : 'text-p-red'}`}>
              {ingresosDelta >= 0 ? '+' : ''}{formatMillones(ingresosDelta)} ({ingresosDeltaPct >= 0 ? '+' : ''}{ingresosDeltaPct.toFixed(1)}%)
            </p>
          )}
        </div>

        {/* Margen */}
        <div className="glass-panel p-5">
          <p className="text-sm text-p-muted mb-2">Margen Proyectado</p>
          <p className={`text-2xl font-bold ${margenSimulado < 0 ? 'text-p-red' : margenDelta >= 0 ? 'text-p-lime' : 'text-p-red'}`}>
            {formatMillones(margenSimulado)}
          </p>
          {sliderValue !== 0 && (
            <p className={`text-sm mt-1 ${margenDelta >= 0 ? 'text-p-lime' : 'text-p-red'}`}>
              {margenDelta >= 0 ? '+' : ''}{formatMillones(margenDelta)} ({margenDeltaPct >= 0 ? '+' : ''}{margenDeltaPct.toFixed(1)}%)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Shared Components ───────────────────────────────────────

function KpiCard({ label, value, icon: Icon, color, sub, subColor }: {
  label: string; value: string; icon: React.ElementType; color: string
  sub?: string; subColor?: string
}) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm text-p-gray-light font-medium">{label}</h3>
        <Icon size={20} className={color} />
      </div>
      <p className={`text-[32px] font-bold leading-none ${color}`}>{value}</p>
      {sub && <p className={`text-[13px] mt-2 ${subColor || 'text-p-muted'}`}>{sub}</p>}
    </div>
  )
}

function ImpactBadge({ value }: { value: number }) {
  const cls = value > 0 ? 'badge badge-green' : value < 0 ? 'badge badge-red' : 'badge badge-yellow'
  return <span className={cls}>{value > 0 ? '+' : ''}{value.toFixed(1)}%</span>
}

function SparkCell({ value, maxAbs }: { value: number; maxAbs: number }) {
  const width = maxAbs > 0 ? Math.round((Math.abs(value) / maxAbs) * 100) : 0
  return (
    <div className="inline-flex flex-col items-end gap-1">
      <ImpactBadge value={value} />
      <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: value >= 0 ? '#AEC911' : '#FF5757' }} />
      </div>
    </div>
  )
}

function formatMillones(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    const m = value / 1_000_000
    return `$${m.toFixed(2)}M`
  }
  if (abs >= 1_000) {
    const k = value / 1_000
    return `$${k.toFixed(0)}K`
  }
  return `$${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
}
