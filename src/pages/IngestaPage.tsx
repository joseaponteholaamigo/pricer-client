import { useState, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Clock, UploadCloud, X, Download } from 'lucide-react'
import api from '../lib/api'
import type { CargaResult, CargaHistorialRow } from '../lib/types'
import EmptyState from '../components/EmptyState'
import { SkeletonTable } from '../components/Skeleton'
import QueryErrorState from '../components/QueryErrorState'

const REQUIRED_COLUMNS: Record<UploadType, string[]> = {
  skus: ['Código SKU', 'Nombre', 'Marca', 'Categoría', 'PVP Sugerido', 'Costo Variable'],
  competidores: ['Código SKU Cliente', 'Nombre Competidor', 'Producto Competidor', 'Precio', 'Retailer'],
}

function parseFirstRow(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', sheetRows: 1 })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })
        resolve((rows[0] as string[] | undefined) ?? [])
      } catch {
        reject(new Error('No se pudo leer el archivo'))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsArrayBuffer(file)
  })
}

interface ColumnPreview {
  file: File
  foundColumns: string[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins} minuto${mins !== 1 ? 's' : ''}`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} hora${hrs !== 1 ? 's' : ''}`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `hace ${days} día${days !== 1 ? 's' : ''}`
  const weeks = Math.floor(days / 7)
  return `hace ${weeks} semana${weeks !== 1 ? 's' : ''}`
}

type UploadType = 'skus' | 'competidores'

function downloadTemplate(type: 'portafolio' | 'competidores') {
  const configs = {
    portafolio: {
      filename: 'plantilla-portafolio.xlsx',
      headers: ['Código SKU', 'EAN', 'Nombre', 'Marca', 'Categoría', 'PVP', 'Costo Variable', 'Peso Profit Pool', 'IVA'],
    },
    competidores: {
      filename: 'plantilla-competidores.xlsx',
      headers: ['EAN Propio', 'EAN Competidor', 'Marca Competidor', 'Retailer', 'PVP Competidor'],
    },
  }

  const { filename, headers } = configs[type]
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers])
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')
  XLSX.writeFile(wb, filename)
}

export default function IngestaPage() {
  return (
    <div className="space-y-8">
      {/* Template downloads */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-p-muted">Descargar plantilla:</span>
        <button
          onClick={() => downloadTemplate('portafolio')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs border border-p-border rounded-lg text-p-gray-light hover:text-white hover:border-p-muted transition-colors"
        >
          <Download size={13} />
          Portafolio (SKU + precios)
        </button>
        <button
          onClick={() => downloadTemplate('competidores')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs border border-p-border rounded-lg text-p-gray-light hover:text-white hover:border-p-muted transition-colors"
        >
          <Download size={13} />
          Competidores
        </button>
      </div>

      {/* Upload zones */}
      <div className="grid grid-cols-2 gap-6">
        <UploadZone
          type="skus"
          title="SKUs y Precios"
          description="Código SKU · Nombre · Marca · Categoría · PVP Sugerido · Costo Variable"
          endpoint="/ingesta/upload/skus"
        />
        <UploadZone
          type="competidores"
          title="Precios de Competidores"
          description="Código SKU Cliente · Nombre Competidor · Producto Competidor · Precio · Retailer"
          endpoint="/ingesta/upload/competidores"
        />
      </div>

      {/* History */}
      <HistorialSection />
    </div>
  )
}

/* ──────────────────────────── Upload Zone ──────────────────────────── */

function UploadZone({ type, title, description, endpoint }: {
  type: UploadType; title: string; description: string; endpoint: string
}) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<CargaResult | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [preview, setPreview] = useState<ColumnPreview | null>(null)

  const required = REQUIRED_COLUMNS[type]

  const handleFile = useCallback(async (file: File) => {
    setResult(null)
    setShowErrors(false)

    if (!file.name.endsWith('.xlsx')) {
      setResult({ totalProcesados: 0, totalErrores: 1, errores: [{ fila: 0, columna: null, mensaje: 'Solo se aceptan archivos .xlsx' }] })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setResult({ totalProcesados: 0, totalErrores: 1, errores: [{ fila: 0, columna: null, mensaje: 'El archivo excede el límite de 5MB' }] })
      return
    }

    try {
      const cols = await parseFirstRow(file)
      setPreview({ file, foundColumns: cols })
    } catch {
      setResult({ totalProcesados: 0, totalErrores: 1, errores: [{ fila: 0, columna: null, mensaje: 'No se pudo leer el archivo' }] })
    }
  }, [])

  const doUpload = useCallback(async (file: File) => {
    setPreview(null)
    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await api.post<CargaResult>(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setResult(res.data)
      queryClient.invalidateQueries({ queryKey: ['ingesta-historial'] })
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { errores?: { mensaje: string }[] } } })?.response?.data?.errores?.[0]?.mensaje
        ?? 'Error al procesar el archivo'
      setResult({ totalProcesados: 0, totalErrores: 1, errores: [{ fila: 0, columna: null, mensaje: message }] })
    } finally {
      setUploading(false)
    }
  }, [endpoint, queryClient])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }, [handleFile])

  return (
    <div className="glass-panel p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-p-lime" />
          {title}
        </h3>
        <p className="text-xs text-p-muted mt-1">Tu archivo debe incluir estas columnas: <span className="text-p-gray-light">{description}</span></p>
      </div>

      {/* Column preview panel */}
      {preview && (() => {
        const normalizeCol = (s: string) => s.trim().toLowerCase()
        const foundNorm = preview.foundColumns.map(normalizeCol)
        const matched = required.filter(r => foundNorm.includes(normalizeCol(r)))
        const missing = required.filter(r => !foundNorm.includes(normalizeCol(r)))
        const allFound = missing.length === 0

        return (
          <div className="rounded-xl border border-p-border bg-white/5 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Validación de columnas</p>
                <p className="text-xs text-p-muted mt-0.5">{preview.file.name}</p>
              </div>
              <button onClick={() => setPreview(null)} className="text-p-muted hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              {required.map(col => {
                const found = foundNorm.includes(normalizeCol(col))
                return (
                  <div key={col} className="flex items-center justify-between text-xs">
                    <span className="text-p-gray-light">{col}</span>
                    {found ? (
                      <span className="flex items-center gap-1 text-green-400"><CheckCircle2 size={12} /> Encontrada</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400"><AlertCircle size={12} /> Faltante</span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className={`text-xs font-medium px-3 py-2 rounded-lg ${allFound ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
              {matched.length} de {required.length} columnas encontradas
              {!allFound && <span className="block text-red-400 mt-0.5">Faltan: {missing.join(', ')}</span>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setPreview(null); inputRef.current?.click() }}
                className="px-3 py-1.5 text-xs border border-p-border rounded-lg text-p-muted hover:text-white transition-colors"
              >
                Cambiar archivo
              </button>
              <button
                onClick={() => doUpload(preview.file)}
                disabled={!allFound}
                className="flex-1 px-3 py-1.5 text-xs bg-p-lime/20 text-p-lime border border-p-lime/30 rounded-lg hover:bg-p-lime/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirmar y cargar
              </button>
            </div>
          </div>
        )
      })()}

      {/* Drop zone */}
      {!preview && (
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragOver ? 'border-p-lime bg-p-lime/10' : 'border-p-border hover:border-p-muted hover:bg-white/5'}
        `}
      >
        <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={onFileSelect} />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-p-lime border-t-transparent" />
            <p className="text-sm text-p-muted">Procesando archivo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className={`w-8 h-8 ${isDragOver ? 'text-p-lime' : 'text-p-muted'}`} />
            <div>
              <p className="text-sm text-white">Arrastra tu archivo aquí, o haz clic para buscarlo</p>
              <p className="text-xs text-p-muted mt-1">Formato .xlsx · máximo 5 MB</p>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Uploading indicator (shown when preview is confirmed and uploading) */}
      {uploading && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-p-lime border-t-transparent" />
          <p className="text-sm text-p-muted">Procesando archivo...</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-lg p-4 ${result.totalErrores === 0 ? 'bg-green-900/30 border border-green-700/40' : result.totalProcesados > 0 ? 'bg-yellow-900/30 border border-yellow-600/40' : 'bg-red-900/30 border border-red-700/40'}`}>
          <div className="flex items-center gap-2">
            {result.totalErrores === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
            <div className="flex-1">
              <p className="text-sm text-white">
                {result.totalProcesados} registro{result.totalProcesados !== 1 ? 's' : ''} procesado{result.totalProcesados !== 1 ? 's' : ''}
                {result.totalErrores > 0 && (
                  <span className="text-yellow-300"> · {result.totalErrores} error{result.totalErrores !== 1 ? 'es' : ''}</span>
                )}
              </p>
            </div>
            {result.errores.length > 0 && (
              <button onClick={() => setShowErrors(!showErrors)} className="text-p-muted hover:text-white">
                {showErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>

          {showErrors && result.errores.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-p-muted border-b border-white/10">
                    <th className="text-left py-1 pr-3">Fila</th>
                    <th className="text-left py-1 pr-3">Columna</th>
                    <th className="text-left py-1">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errores.map((err, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-1 pr-3 text-white">{err.fila}</td>
                      <td className="py-1 pr-3 text-p-muted">{err.columna ?? '—'}</td>
                      <td className="py-1 text-red-300">{err.mensaje}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────── Historial ──────────────────────────── */

function HistorialSection() {
  const { data: historial = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['ingesta-historial'],
    queryFn: () => api.get<CargaHistorialRow[]>('/ingesta/historial').then(r => r.data),
  })

  return (
    <div className="glass-panel overflow-x-auto">
      <div className="px-4 py-3 border-b border-p-border">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-p-muted" />
          Historial de Cargas
        </h3>
      </div>

      {isLoading ? (
        <table className="w-full text-sm">
          <tbody><SkeletonTable rows={4} columns={5} /></tbody>
        </table>
      ) : isError ? (
        <QueryErrorState onRetry={refetch} message="No se pudo cargar el historial de cargas." />
      ) : historial.length === 0 ? (
        <EmptyState
          icon={UploadCloud}
          title="Todavía no has cargado archivos"
          description="Sube tu catálogo de productos para que los demás módulos empiecen a funcionar."
        />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-p-border text-p-muted text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4">Fecha</th>
              <th className="text-left py-3 px-4">Tipo</th>
              <th className="text-left py-3 px-4">Archivo</th>
              <th className="text-center py-3 px-4">Estado</th>
              <th className="text-right py-3 px-4">Registros</th>
              <th className="text-right py-3 px-4">Errores</th>
              <th className="text-left py-3 px-4">Subido por</th>
            </tr>
          </thead>
          <tbody>
            {historial.map(row => (
              <tr key={row.id} className="border-b border-p-border/50">
                <td className="py-3 px-4 text-p-muted" title={new Date(row.fechaCarga).toLocaleString('es-CO')}>
                  {timeAgo(row.fechaCarga)}
                </td>
                <td className="py-3 px-4 text-white capitalize">{row.tipoArchivo}</td>
                <td className="py-3 px-4 text-p-muted text-xs">{row.nombreArchivo}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <EstadoBadge estado={row.estado} />
                    {row.estado === 'completado_con_errores' && (
                      <button className="text-xs text-p-blue hover:underline">Ver errores</button>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="text-white">{row.registrosProcesados}</div>
                  <div className="text-xs text-p-muted">{row.registrosProcesados} cargados</div>
                </td>
                <td className="py-3 px-4 text-right">
                  {row.totalErrores > 0 ? (
                    <span className="text-yellow-300">{row.totalErrores}</span>
                  ) : (
                    <span className="text-p-muted">0</span>
                  )}
                </td>
                <td className="py-3 px-4 text-p-muted text-xs">{row.subidoPor ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === 'completado') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-700/40">
        <CheckCircle2 className="w-3 h-3" /> Completado
      </span>
    )
  }
  if (estado === 'completado_con_errores') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-300 border border-yellow-700/40">
        <AlertCircle className="w-3 h-3" /> Con errores
      </span>
    )
  }
  if (estado === 'error') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/40">
        <AlertCircle className="w-3 h-3" /> Error
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800/40 text-gray-400 border border-gray-700/40">
      <Clock className="w-3 h-3" /> {estado}
    </span>
  )
}
