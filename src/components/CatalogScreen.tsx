import { useState } from 'react'
import { Service, SERVICES } from '../App'
import limpiezaImg from '@/imports/Captura_de_pantalla_2026-09-06_200346.png'

const CATEGORIES = ['Todas', 'Limpieza', 'Tecnología', 'Mantenimiento', 'Diseño']

type CatalogView = 'initial' | 'loading' | 'results' | 'no-results'

const CATEGORY_ICONS: Record<string, string> = {
  Limpieza: '🧹',
  Tecnología: '💻',
  Mantenimiento: '🔧',
  Diseño: '🎨',
}

interface Props {
  onSelectService: (service: Service) => void
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
      <div className="skeleton h-44 w-full" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-5 w-4/5 rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="flex justify-between items-center pt-2">
          <div className="skeleton h-6 w-28 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
        <div className="skeleton h-10 w-full rounded-xl mt-2" />
      </div>
    </div>
  )
}

function ServiceCard({
  service,
  onSelect,
}: {
  service: Service
  onSelect: () => void
}) {
  return (
    <article
      className="bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 fade-in"
      style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(37,99,235,0.10)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: '176px', backgroundColor: '#dbeafe' }}>
        <img
          src={service.id === '1' ? limpiezaImg : service.image}
          alt={`Imagen de ${service.name}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: '#374151', backdropFilter: 'blur(4px)' }}
        >
          {CATEGORY_ICONS[service.category]} {service.category}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3
          className="font-bold text-gray-900 text-base mb-1 leading-snug"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {service.name}
        </h3>

        <div className="flex items-center gap-1 mb-3">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 1a5 5 0 110 10A5 5 0 017 2zm0 2a.5.5 0 00-.5.5v2.793l-1.646 1.647a.5.5 0 00.707.707l1.793-1.793A.5.5 0 007.5 7.5V4.5A.5.5 0 007 4z"
              fill="#6b7280"
            />
          </svg>
          <span className="text-xs text-gray-500">
            Proveedor:{' '}
            <span className="font-semibold text-gray-700">{service.provider}</span>
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-4 leading-relaxed flex-1">{service.description}</p>

        {/* Price + Duration */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span
              className="text-lg font-bold"
              style={{ color: '#2563eb', fontFamily: 'Nunito, sans-serif' }}
            >
              {service.price}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="#9ca3af" strokeWidth="1.2" />
              <path d="M6.5 3.5v3l2 1.5" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span>{service.duration}</span>
          </div>
        </div>

        <button
          onClick={onSelect}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ backgroundColor: '#2563eb' }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.backgroundColor = '#2563eb'
          }}
          aria-label={`Ver disponibilidad de ${service.name}`}
        >
          Ver disponibilidad
        </button>
      </div>
    </article>
  )
}

export default function CatalogScreen({ onSelectService }: Props) {
  const [view, setView] = useState<CatalogView>('initial')
  const [displayedServices, setDisplayedServices] = useState<Service[]>(SERVICES)

  const [searchInput, setSearchInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('Todas')
  const [minPriceInput, setMinPriceInput] = useState(0)
  const [maxPriceInput, setMaxPriceInput] = useState(300000)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  const runFilter = (
    search: string,
    category: string,
    minP: number,
    maxP: number,
  ) => {
    setView('loading')
    setTimeout(() => {
      const results = SERVICES.filter(s => {
        const matchSearch =
          search === '' ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.provider.toLowerCase().includes(search.toLowerCase()) ||
          s.category.toLowerCase().includes(search.toLowerCase())
        const matchCategory = category === 'Todas' || s.category === category
        const matchPrice = s.priceNum >= minP && s.priceNum <= maxP
        return matchSearch && matchCategory && matchPrice
      })
      setDisplayedServices(results)
      setView(results.length === 0 ? 'no-results' : 'results')
    }, 800)
  }

  const applyFilters = () => {
    const isDefault =
      searchInput === '' &&
      categoryInput === 'Todas' &&
      minPriceInput === 0 &&
      maxPriceInput === 300000
    setHasActiveFilters(!isDefault)
    if (isDefault) {
      setDisplayedServices(SERVICES)
      setView('initial')
      return
    }
    runFilter(searchInput, categoryInput, minPriceInput, maxPriceInput)
  }

  const clearFilters = () => {
    setSearchInput('')
    setCategoryInput('Todas')
    setMinPriceInput(0)
    setMaxPriceInput(300000)
    setHasActiveFilters(false)
    setDisplayedServices(SERVICES)
    setView('initial')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  const servicesShown = view === 'initial' ? SERVICES : displayedServices
  const resultCount = servicesShown.length

  return (
    <main>
      {/* Hero / Search */}
      <section
        className="py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-4xl sm:text-5xl font-extrabold text-white mb-3 leading-tight"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Encuentra el servicio que necesitas
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Los mejores proveedores, disponibles cuando los necesitas
          </p>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-2xl mx-auto" role="search">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="7.5" cy="7.5" r="5.5" stroke="#9ca3af" strokeWidth="1.6" />
                <path d="M12 12l3.5 3.5" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Buscar por servicio, proveedor o categoría..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-gray-900 text-sm border-0 focus-visible:ring-2 focus-visible:ring-blue-300"
                style={{ backgroundColor: 'white' }}
                aria-label="Buscar servicios"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: '#f59e0b', color: '#111827' }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = '#d97706'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = '#f59e0b'
              }}
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Filters + Results */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter panel */}
        <div
          className="bg-white rounded-2xl border p-5 mb-6"
          style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          role="region"
          aria-label="Filtros de búsqueda"
        >
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Category */}
            <fieldset className="flex-1">
              <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Categoría
              </legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryInput(cat)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                    style={{
                      backgroundColor: categoryInput === cat ? '#2563eb' : 'transparent',
                      color: categoryInput === cat ? '#fff' : '#374151',
                      borderColor: categoryInput === cat ? '#2563eb' : '#d1d5db',
                    }}
                    aria-pressed={categoryInput === cat}
                    aria-label={`Categoría ${cat}`}
                  >
                    {cat !== 'Todas' && CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ''}
                    {cat}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Price range */}
            <div className="lg:w-72">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Precio máximo:{' '}
                <span className="text-blue-600 normal-case font-bold">
                  ${maxPriceInput.toLocaleString('es-CO')} COP
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={300000}
                step={10000}
                value={maxPriceInput}
                onChange={e => setMaxPriceInput(Number(e.target.value))}
                className="w-full accent-blue-600"
                aria-label={`Precio máximo: ${maxPriceInput} COP`}
                aria-valuemin={0}
                aria-valuemax={300000}
                aria-valuenow={maxPriceInput}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>$0</span>
                <span>$300.000</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-end gap-2 lg:pb-0">
              <button
                onClick={applyFilters}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: '#2563eb' }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = '#2563eb'
                }}
                aria-label="Aplicar filtros seleccionados"
              >
                Aplicar filtros
              </button>
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters && view === 'initial'}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  color: hasActiveFilters || view !== 'initial' ? '#374151' : '#9ca3af',
                  borderColor: hasActiveFilters || view !== 'initial' ? '#d1d5db' : '#e5e7eb',
                  cursor: hasActiveFilters || view !== 'initial' ? 'pointer' : 'default',
                }}
                aria-label="Limpiar todos los filtros"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Results header */}
        {view !== 'loading' && view !== 'no-results' && (
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">{resultCount}</span>{' '}
              {resultCount === 1 ? 'servicio encontrado' : 'servicios encontrados'}
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                  Filtros activos
                </span>
              )}
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {view === 'loading' && (
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-live="polite"
            aria-busy="true"
            aria-label="Cargando servicios..."
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* No results */}
        {view === 'no-results' && (
          <div
            className="flex flex-col items-center justify-center py-20 text-center fade-in"
            role="status"
            aria-live="polite"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#f3f4f6' }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="10" stroke="#9ca3af" strokeWidth="2" />
                <path d="M22 22l6 6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 14h8M14 10v8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              No encontramos servicios disponibles
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm">
              Intenta con otros términos de búsqueda o ajusta los filtros para ampliar los resultados.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#2563eb' }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = '#2563eb'
              }}
            >
              Restablecer filtros
            </button>
          </div>
        )}

        {/* Service grid */}
        {(view === 'initial' || view === 'results') && (
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-live="polite"
            aria-label="Listado de servicios"
          >
            {servicesShown.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                onSelect={() => onSelectService(service)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
