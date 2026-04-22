import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Plot from '../lib/plotly'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowRight, X } from 'lucide-react'
import api from '../lib/api'
import type { PortfolioRow, ValueMapData } from '../lib/types'
import SearchInput from '../components/SearchInput'
import { useTableSearch } from '../components/useTableSearch'
import Drawer from '../components/Drawer'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

export default function PricingPage() {
  const [marca, setMarca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null)
  const isMobile = useIsMobile()

  const { data: filterOptions } = useQuery({
    queryKey: ['pricing-filters'],
    queryFn: () => api.get<{ marcas: string[]; categorias: string[] }>('/pricing/filters').then(r => r.data),
  })

  const filters = `marca=${marca}&categoria=${categoria}`

  useEffect(() => { setSelectedSkuId(null) }, [marca, categoria])

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

      {/* Banner */}
      <div className="flex items-center gap-3 bg-yellow-900/30 border border-yellow-600/40 rounded-lg px-4 py-3 mb-6">
        <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
        <p className="text-sm text-yellow-200">
          <span className="font-semibold">Estimación de referencia</span> — Los precios mostrados son un punto de partida calculado con los datos disponibles. Valida los ajustes con tu equipo antes de aplicarlos.
        </p>
      </div>

      {/* Split-view layout */}
      <div className="flex gap-6 items-start">
        <div className={`min-w-0 transition-all duration-200 ${selectedSkuId && !isMobile ? 'w-3/5' : 'w-full'}`}>
          <PortfolioTab filters={filters} selectedSkuId={selectedSkuId} onSkuClick={setSelectedSkuId} />
        </div>
        {selectedSkuId && !isMobile && (
          <div className="w-2/5 min-w-0 sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">Mapa de Valor</span>
              <button onClick={() => setSelectedSkuId(null)} className="text-p-muted hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <ValueMapPanel skuId={selectedSkuId} />
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={!!selectedSkuId && isMobile}
        title="Mapa de Valor"
        onClose={() => setSelectedSkuId(null)}
      >
        {selectedSkuId && isMobile && <ValueMapPanel skuId={selectedSkuId} />}
      </Drawer>
    </div>
  )
}

/* ──────────────────────────── Tab 1: Portfolio ──────────────────────────── */

function PortfolioTab({ filters, selectedSkuId, onSkuClick }: { filters: string; selectedSkuId: string | null; onSkuClick: (id: string | null) => void }) {
  const [filterRec, setFilterRec] = useState<string | null>(null)
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['pricing-portfolio', filters],
    queryFn: () => api.get<PortfolioRow[]>(`/pricing/portfolio?${filters}`).then(r => r.data),
  })

  const [searchedRows, searchTerm, setSearchTerm] = useTableSearch(rows, ['nombre', 'codigoSku', 'marca', 'categoria'])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-p-lime border-t-transparent" />
      </div>
    )
  }

  const withComp = rows.filter(r => r.tieneCompetidores)
  const subir = withComp.filter(r => r.recomendacion === 'Subir').length
  const bajar = withComp.filter(r => r.recomendacion === 'Bajar').length
  const mantener = withComp.filter(r => r.recomendacion === 'Mantener').length

  const filteredRows = filterRec
    ? searchedRows.filter(r => {
        if (filterRec === 'sin-datos') return !r.tieneCompetidores
        return r.recomendacion === filterRec
      })
    : searchedRows

  const chips = [
    { label: 'Todos', value: null },
    { label: '↑ Aumentar precio', value: 'Subir' },
    { label: '↓ Reducir precio', value: 'Bajar' },
    { label: '↔ Mantener precio', value: 'Mantener' },
    { label: 'Sin datos', value: 'sin-datos' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-5">
        <KpiCard label="SKUs Analizados" value={String(withComp.length)} icon={TrendingUp} color="text-p-blue" sub={`${rows.length} totales`} />
        <KpiCard label="Productos para subir precio" value={String(subir)} icon={TrendingUp} color="text-p-lime"
          sub={rows.length === 0 ? '— Configura el modelo para ver oportunidades' : subir === 0 ? 'Todos los precios están dentro del rango óptimo' : 'Oportunidad de mejora'} />
        <KpiCard label="Productos para reducir precio" value={String(bajar)} icon={TrendingDown} color="text-p-red"
          sub={rows.length === 0 ? '— Configura el modelo para ver ajustes necesarios' : bajar === 0 ? 'Ningún precio supera el óptimo actualmente' : 'Precio por encima del óptimo'} />
        <KpiCard label="Productos en precio correcto" value={String(mantener)} icon={Minus} color="text-p-muted"
          sub={rows.length === 0 ? '— Configura el modelo para confirmar' : 'Precio alineado'} />
      </div>

      {/* Subtitle */}
      <p className="text-sm text-p-muted">Selecciona un producto para ver su posición en el mercado</p>

      {/* Search + Filter chips */}
      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar producto, marca o SKU..." />
        <div className="flex items-center gap-2 flex-wrap">
          {chips.map(chip => (
            <button
              key={String(chip.value)}
              onClick={() => setFilterRec(chip.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filterRec === chip.value
                  ? 'bg-p-lime/20 text-p-lime border-p-lime/40'
                  : 'border-p-border text-p-muted hover:text-white hover:border-p-muted'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-p-border text-p-muted text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4" style={{ width: '25%' }}>Producto</th>
              <th className="text-left py-3 px-4" style={{ width: '12%' }}>Marca</th>
              <th className="text-right py-3 px-4" style={{ width: '13%' }}>Precio Actual</th>
              <th className="text-right py-3 px-4" style={{ width: '13%' }}>Precio Óptimo</th>
              <th className="text-right py-3 px-4" style={{ width: '12%' }}>Variación</th>
              <th className="text-center py-3 px-4" style={{ width: '15%' }}>Recomendación</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(row => (
              <tr
                key={row.skuId}
                onClick={() => {
                  if (!row.tieneCompetidores) return
                  onSkuClick(selectedSkuId === row.skuId ? null : row.skuId)
                }}
                className={`border-b border-p-border/50 transition-colors ${
                  row.tieneCompetidores
                    ? selectedSkuId === row.skuId
                      ? 'bg-p-lime/10 border-l-2 border-l-p-lime cursor-pointer'
                      : 'hover:bg-white/5 cursor-pointer'
                    : 'opacity-50'
                }`}
              >
                <td className="py-3 px-4">
                  <div className="text-white">{row.nombre}</div>
                  <div className="text-xs text-p-muted">{row.codigoSku} · {row.categoria}</div>
                </td>
                <td className="py-3 px-4 text-p-muted">{row.marca}</td>
                <td className="py-3 px-4 text-right text-white">${row.precioActual.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                <td className="py-3 px-4 text-right text-white font-medium">
                  {row.tieneCompetidores ? `$${row.precioOptimo.toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : '—'}
                </td>
                <td className="py-3 px-4 text-right">
                  {row.tieneCompetidores ? (
                    <span className={`${row.variacionPct > 0 ? 'text-p-lime' : row.variacionPct < 0 ? 'text-p-red' : 'text-p-muted'}`}>
                      {row.variacionPct > 0 ? '+' : ''}{row.variacionPct}%
                    </span>
                  ) : '—'}
                </td>
                <td className="py-3 px-4 text-center">
                  <RecomendacionBadge rec={row.recomendacion} variacion={row.variacionPct} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRows.length === 0 && (
          <div className="text-center py-12 text-p-muted">
            {searchTerm || filterRec
              ? `Sin resultados para "${searchTerm || filterRec}"`
              : 'No hay SKUs para mostrar'}
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────── Value Map Panel ──────────────────────────── */

function ValueMapPanel({ skuId }: { skuId: string }) {
  const navigate = useNavigate()

  const { data: mapData, isLoading } = useQuery({
    queryKey: ['pricing-valuemap', skuId],
    queryFn: () => api.get<ValueMapData>(`/pricing/valuemap/${skuId}`).then(r => r.data),
    enabled: !!skuId,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-p-lime border-t-transparent" />
      </div>
    )
  }

  if (!mapData) {
    return (
      <div className="glass-panel p-8 text-center">
        <p className="text-p-muted">No se pudo generar el Mapa de Valor para este producto</p>
        <p className="text-p-muted text-sm mt-2">Se necesitan competidores con precios configurados</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Scatter Plot */}
      <div className="glass-panel p-4">
        <h3 className="text-sm font-semibold text-white mb-3">{mapData.producto.nombre}</h3>

        {mapData.competidores.length < 2 && (
          <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-600/40 rounded px-3 py-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-200">Solo {mapData.competidores.length} competidor(es) — se recomienda mínimo 2</span>
          </div>
        )}

        <Plot
          data={[
            {
              x: [mapData.lineaValorJusto.xMin, mapData.lineaValorJusto.xMax],
              y: [
                mapData.lineaValorJusto.slope * mapData.lineaValorJusto.xMin + mapData.lineaValorJusto.intercept,
                mapData.lineaValorJusto.slope * mapData.lineaValorJusto.xMax + mapData.lineaValorJusto.intercept,
              ],
              type: 'scatter',
              mode: 'lines',
              name: 'Valor Justo',
              line: { color: 'rgba(255,255,255,0.2)', width: 2, dash: 'dash' },
              hoverinfo: 'skip',
            },
            {
              x: mapData.competidores.map(c => c.valorPercibido),
              y: mapData.competidores.map(c => c.precio),
              text: mapData.competidores.map(c => c.nombre),
              type: 'scatter',
              mode: 'markers+text',
              name: 'Competidores',
              marker: { color: '#8e919e', size: 8, symbol: 'circle' },
              textposition: 'top center',
              textfont: { color: '#8e919e', size: 9 },
              hovertemplate: '<b>%{text}</b><br>$%{y:,.0f}<extra>Competidor</extra>',
            },
            {
              x: [mapData.producto.valorPercibido],
              y: [mapData.producto.precio],
              type: 'scatter',
              mode: 'markers',
              name: 'Mi Producto',
              marker: { color: '#FF5757', size: 14, symbol: 'circle' },
              hovertemplate: `<b>${mapData.producto.nombre}</b><br>$%{y:,.0f}<extra>Mi Producto</extra>`,
            },
            {
              x: [mapData.precioOptimoPunto.valorPercibido],
              y: [mapData.precioOptimoPunto.precio],
              type: 'scatter',
              mode: 'markers',
              name: 'Precio Óptimo',
              marker: { color: '#AEC911', size: 14, symbol: 'star' },
              hovertemplate: `<b>Precio Óptimo</b><br>$%{y:,.0f}<extra>Recomendado</extra>`,
            },
          ]}
          layout={{
            height: 300,
            margin: { t: 20, b: 50, l: 70, r: 20 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            xaxis: {
              title: { text: 'Índice de Valor', font: { color: '#8e919e', size: 11 } },
              color: '#8e919e',
              gridcolor: 'rgba(255,255,255,0.05)',
              zeroline: false,
            },
            yaxis: {
              title: { text: 'Precio ($)', font: { color: '#8e919e', size: 11 } },
              color: '#8e919e',
              gridcolor: 'rgba(255,255,255,0.05)',
              tickprefix: '$',
              zeroline: false,
            },
            legend: {
              font: { color: '#D5D5D7', size: 10 },
              bgcolor: 'transparent',
              orientation: 'h',
              y: -0.18,
            },
            showlegend: true,
          }}
          config={{ responsive: true, displayModeBar: false }}
          className="w-full"
        />
      </div>

      {/* Result */}
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-p-muted">Precio Óptimo Recomendado</p>
        <p className="text-2xl font-bold text-white">
          ${mapData.precioOptimoValor.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <RecomendacionBadge rec={mapData.recomendacion} variacion={mapData.variacionPct} />
          <span className={`text-xs ${mapData.variacionPct >= 0 ? 'text-p-lime' : 'text-p-red'}`}>
            {mapData.variacionPct > 0 ? '+' : ''}{mapData.variacionPct}% vs. precio actual
          </span>
        </div>
        <button
          onClick={() => navigate('/elasticidad')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-p-blue/20 text-p-blue hover:bg-p-blue/30 transition-colors text-xs w-full justify-center"
        >
          Ver Simulador de Elasticidad <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Competitors Table */}
      {mapData.competidores.length > 0 && (
        <div className="glass-panel overflow-x-auto">
          <div className="px-4 py-2 border-b border-p-border">
            <h3 className="text-xs font-semibold text-white">Competidores en el Mapa</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-p-border text-p-muted">
                <th className="text-left py-2 px-4">Competidor</th>
                <th className="text-right py-2 px-4">Precio</th>
                <th className="text-right py-2 px-4">Índice</th>
              </tr>
            </thead>
            <tbody>
              {mapData.competidores.map((comp, i) => (
                <tr key={i} className="border-b border-p-border/50">
                  <td className="py-2 px-4 text-white">{comp.nombre}</td>
                  <td className="py-2 px-4 text-right text-white">${comp.precio.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                  <td className="py-2 px-4 text-right text-p-muted">{comp.valorPercibido.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


/* ──────────────────────────── Shared Components ──────────────────────────── */

function KpiCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: React.ElementType; color: string; sub?: string
}) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-p-muted uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-p-muted mt-1">{sub}</div>}
    </div>
  )
}

function RecomendacionBadge({ rec }: { rec: string; variacion: number }) {
  if (rec === 'Subir') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-700/40">
        <TrendingUp className="w-3 h-3" /> Aumentar precio
      </span>
    )
  }
  if (rec === 'Bajar') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/40">
        <TrendingDown className="w-3 h-3" /> Reducir precio
      </span>
    )
  }
  if (rec === 'Mantener') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800/40 text-gray-400 border border-gray-700/40">
        <Minus className="w-3 h-3" /> Mantener precio
      </span>
    )
  }
  return <span className="text-xs text-p-muted">{rec}</span>
}
