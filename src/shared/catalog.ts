// ─── Catálogo canónico del sistema ───────────────────────────────────────────
//
// Fuente única de listas globales del sistema. Todo dropdown de creación,
// filtro o validación que use una de estas listas debe importar desde aquí.
//
// IMPORTANTE: cuando el backend exponga `/api/catalog/*`, este archivo se
// reemplaza por hooks `useCategorias()`, `useIndustrias()`, etc. que hagan
// fetch. La forma de los objetos (`{ value, label, ...metadata }`) ya está
// alineada con el payload esperado.
//
// Por ahora: catálogo duplicado (también existe en prisier-client). Cuando
// la API esté arriba, ambos consumirán de allí.
// ────────────────────────────────────────────────────────────────────────────

export interface CatalogOption {
  value: string
  label: string
}

export interface CategoriaOption extends CatalogOption {
  iva: number
}

export interface PaisOption extends CatalogOption {
  codigo: string
}

// ─── Categorías globales ────────────────────────────────────────────────────
// IVA Colombia: alimentos básicos 0%, productos preparados/snacks 19%.
// Lista larga para cubrir consumo masivo, alimentos y bebidas.

export const CATEGORIAS: CategoriaOption[] = [
  { value: 'aceites',              label: 'Aceites',              iva: 0.00 },
  { value: 'agua',                 label: 'Agua',                 iva: 0.00 },
  { value: 'arroz',                label: 'Arroz',                iva: 0.00 },
  { value: 'azucar',               label: 'Azúcar',               iva: 0.00 },
  { value: 'bebes',                label: 'Bebés',                iva: 0.19 },
  { value: 'bebidas_energeticas',  label: 'Bebidas Energéticas',  iva: 0.19 },
  { value: 'cafe',                 label: 'Café',                 iva: 0.00 },
  { value: 'carnicos',             label: 'Cárnicos',             iva: 0.00 },
  { value: 'cereales',             label: 'Cereales',             iva: 0.00 },
  { value: 'chocolates',           label: 'Chocolates',           iva: 0.19 },
  { value: 'condimentos',          label: 'Condimentos',          iva: 0.19 },
  { value: 'congelados',           label: 'Congelados',           iva: 0.19 },
  { value: 'cuidado_personal',     label: 'Cuidado Personal',     iva: 0.19 },
  { value: 'enlatados',            label: 'Enlatados',            iva: 0.19 },
  { value: 'galletas',             label: 'Galletas',             iva: 0.19 },
  { value: 'gaseosas',             label: 'Gaseosas',             iva: 0.19 },
  { value: 'granos',               label: 'Granos',               iva: 0.00 },
  { value: 'harinas',              label: 'Harinas',              iva: 0.00 },
  { value: 'hidratantes',          label: 'Hidratantes',          iva: 0.19 },
  { value: 'higiene',              label: 'Higiene',              iva: 0.19 },
  { value: 'jugos',                label: 'Jugos',                iva: 0.00 },
  { value: 'lacteos',              label: 'Lácteos',              iva: 0.00 },
  { value: 'leguminosas',          label: 'Leguminosas',          iva: 0.00 },
  { value: 'limpieza',             label: 'Limpieza',             iva: 0.19 },
  { value: 'mascotas',             label: 'Mascotas',             iva: 0.19 },
  { value: 'panaderia',            label: 'Panadería',            iva: 0.00 },
  { value: 'pastas',               label: 'Pastas',               iva: 0.00 },
  { value: 'salsas',               label: 'Salsas',               iva: 0.19 },
  { value: 'salud',                label: 'Salud',                iva: 0.00 },
  { value: 'snacks',               label: 'Snacks',               iva: 0.19 },
  { value: 'tes',                  label: 'Tés',                  iva: 0.19 },
]

// ─── Industrias soportadas para Tenants ─────────────────────────────────────

export const INDUSTRIAS: CatalogOption[] = [
  { value: 'alimentos',       label: 'Alimentos' },
  { value: 'bebidas',         label: 'Bebidas' },
  { value: 'consumo_masivo',  label: 'Consumo Masivo' },
  { value: 'educacion',       label: 'Educación' },
  { value: 'electronica',     label: 'Electrónica' },
  { value: 'farmaceutico',    label: 'Farmacéutico' },
  { value: 'lacteos',         label: 'Lácteos' },
  { value: 'moda',            label: 'Moda' },
  { value: 'retail',          label: 'Retail' },
  { value: 'textil',          label: 'Textil' },
]

// ─── Roles del sistema (D1 — rol único `cliente` para tenant users) ─────────

export const ROLES: CatalogOption[] = [
  { value: 'admin',             label: 'Admin' },
  { value: 'consultor_prisier', label: 'Consultor Prisier' },
  { value: 'cliente',           label: 'Cliente' },
]

// ─── Planes de suscripción ──────────────────────────────────────────────────

export const PLANES: CatalogOption[] = [
  { value: 'starter',      label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise',   label: 'Enterprise' },
]

// ─── Estados ────────────────────────────────────────────────────────────────

export const ESTADOS_TENANT: CatalogOption[] = [
  { value: 'activo',     label: 'Activo' },
  { value: 'inactivo',   label: 'Inactivo' },
  { value: 'suspendido', label: 'Suspendido' },
]

export const ESTADOS_USUARIO: CatalogOption[] = [
  { value: 'activo',   label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
]

// ─── Audit Logs ─────────────────────────────────────────────────────────────

export const AUDIT_ACCIONES: CatalogOption[] = [
  { value: 'login',             label: 'Login' },
  { value: 'logout',            label: 'Logout' },
  { value: 'cambio_regla',      label: 'Cambio de regla' },
  { value: 'creacion_tenant',   label: 'Creación de tenant' },
  { value: 'edicion_tenant',    label: 'Edición de tenant' },
  { value: 'creacion_usuario',  label: 'Creación de usuario' },
  { value: 'edicion_usuario',   label: 'Edición de usuario' },
  { value: 'upload_archivo',    label: 'Upload de archivo' },
  { value: 'exportacion',       label: 'Exportación' },
]

export const AUDIT_ENTIDADES: CatalogOption[] = [
  { value: 'tenant',     label: 'Tenant' },
  { value: 'usuario',    label: 'Usuario' },
  { value: 'regla',      label: 'Regla' },
  { value: 'sku',        label: 'SKU' },
  { value: 'competidor', label: 'Competidor' },
  { value: 'retailer',   label: 'Retailer' },
  { value: 'portafolio', label: 'Portafolio' },
  { value: 'sesion',     label: 'Sesión' },
]

// ─── Países (para competidores y retailers) ─────────────────────────────────

export const PAISES: PaisOption[] = [
  { value: 'colombia',  label: 'Colombia',  codigo: 'CO' },
  { value: 'usa',       label: 'Estados Unidos', codigo: 'US' },
  { value: 'mexico',    label: 'México',    codigo: 'MX' },
  { value: 'brasil',    label: 'Brasil',    codigo: 'BR' },
  { value: 'chile',     label: 'Chile',     codigo: 'CL' },
  { value: 'peru',      label: 'Perú',      codigo: 'PE' },
  { value: 'argentina', label: 'Argentina', codigo: 'AR' },
  { value: 'ecuador',   label: 'Ecuador',   codigo: 'EC' },
  { value: 'espana',    label: 'España',    codigo: 'ES' },
  { value: 'austria',   label: 'Austria',   codigo: 'AT' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Devuelve el `label` legible para un `value` del catálogo. */
export function labelOf<T extends CatalogOption>(list: T[], value: string): string {
  return list.find(o => o.value === value)?.label ?? value
}

/** Set de `value`s válidos para validar contra el catálogo. */
export function validValues<T extends CatalogOption>(list: T[]): Set<string> {
  return new Set(list.map(o => o.value))
}

// ─── Atributos sugeridos por categoría (defaults globales) ──────────────────
// Cada tenant puede sobrescribirlos en A2.5. Esto sirve como punto de partida
// cuando se crea una categoría nueva sin atributos previos.

export const ATRIBUTOS_DEFAULT_POR_CATEGORIA: Record<string, string[]> = {
  aceites:             ['Precio', 'Tipo extracción', 'Sabor', 'Empaque', 'Disponibilidad'],
  agua:                ['Precio', 'Disponibilidad', 'Empaque', 'Pureza', 'Marca'],
  arroz:               ['Calidad grano', 'Precio', 'Tiempo cocción', 'Empaque', 'Disponibilidad'],
  azucar:              ['Calidad', 'Precio', 'Marca', 'Presentación', 'Disponibilidad'],
  bebes:               ['Calidad', 'Marca', 'Disponibilidad', 'Innovación', 'Presentación'],
  bebidas_energeticas: ['Sabor', 'Precio', 'Empaque', 'Disponibilidad', 'Marca'],
  cafe:                ['Aroma', 'Precio', 'Origen', 'Empaque', 'Marca'],
  carnicos:            ['Frescura', 'Precio', 'Corte', 'Empaque', 'Marca'],
  cereales:            ['Sabor', 'Precio', 'Fibra', 'Empaque', 'Marca'],
  chocolates:          ['Sabor', 'Precio', 'Cacao %', 'Empaque', 'Marca'],
  condimentos:         ['Sabor', 'Marca', 'Presentación', 'Disponibilidad', 'Innovación'],
  congelados:          ['Calidad', 'Marca', 'Innovación', 'Disponibilidad', 'Presentación'],
  enlatados:           ['Calidad', 'Marca', 'Disponibilidad', 'Presentación', 'Innovación'],
  galletas:            ['Sabor', 'Precio', 'Empaque', 'Tipo', 'Marca'],
  gaseosas:            ['Sabor', 'Precio', 'Disponibilidad', 'Empaque', 'Marca'],
  granos:              ['Calidad', 'Disponibilidad', 'Marca', 'Presentación', 'Innovación'],
  harinas:             ['Calidad', 'Disponibilidad', 'Marca', 'Presentación', 'Precio'],
  hidratantes:         ['Sabor', 'Precio', 'Electrolitos', 'Disponibilidad', 'Marca'],
  higiene:             ['Calidad', 'Marca', 'Disponibilidad', 'Presentación', 'Precio'],
  jugos:               ['Sabor', 'Contenido de fruta', 'Precio', 'Empaque', 'Disponibilidad'],
  lacteos:             ['Frescura', 'Precio', 'Sabor', 'Empaque', 'Disponibilidad'],
  limpieza:            ['Calidad', 'Marca', 'Disponibilidad', 'Precio', 'Presentación'],
  mascotas:            ['Calidad', 'Marca', 'Innovación', 'Disponibilidad', 'Presentación'],
  panaderia:           ['Calidad', 'Frescura', 'Marca', 'Disponibilidad', 'Presentación'],
  pastas:              ['Precio', 'Calidad', 'Tiempo cocción', 'Empaque', 'Disponibilidad'],
  salsas:              ['Sabor', 'Precio', 'Empaque', 'Tipo', 'Marca'],
  salud:               ['Calidad', 'Marca', 'Innovación', 'Disponibilidad', 'Presentación'],
  snacks:              ['Sabor', 'Precio', 'Empaque', 'Tipo', 'Marca'],
  tes:                 ['Sabor', 'Precio', 'Variedad', 'Empaque', 'Disponibilidad'],
}
