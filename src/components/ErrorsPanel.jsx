import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { downloadErrorLogTxt } from '../errors/exportErrorLog'
import { formatLogTimestamp } from '../errors/formatLogTimestamp'
import {
  ERROR_CATEGORY,
  ERROR_CATEGORY_LABELS,
  ERROR_SEVERITY,
  filterMonitoringErrors,
} from '../errors/monitoringErrors'
import { colors } from '../styles/tokens'

const PAGE_SIZE = 100

const widgetStyle = {
  position: 'absolute',
  bottom: 16,
  right: 16,
  zIndex: 50,
  width: 'min(400px, calc(100vw - 32px))',
  borderRadius: 12,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  boxShadow: '0 12px 40px rgba(18, 20, 26, 0.18)',
  pointerEvents: 'auto',
}

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  background: colors.surface,
  pointerEvents: 'auto',
}

const severityColors = {
  [ERROR_SEVERITY.ERROR]: '#c62828',
  [ERROR_SEVERITY.WARNING]: '#e65100',
  [ERROR_SEVERITY.INFO]: '#1565c0',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '16px 20px',
  borderBottom: `1px solid ${colors.border}`,
  flexShrink: 0,
}

const titleStyle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: colors.text,
}

const countBadgeStyle = (severity) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 24,
  height: 24,
  padding: '0 8px',
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 700,
  color: colors.triviaWhite,
  background: severityColors[severity] ?? severityColors[ERROR_SEVERITY.WARNING],
})

const bodyPadding = { padding: '12px 14px' }

const previewStyle = {
  margin: '0 0 10px',
  fontSize: 13,
  lineHeight: 1.45,
  color: colors.textMuted,
}

const toolbarStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  padding: '14px 20px',
  borderBottom: `1px solid ${colors.border}`,
  flexShrink: 0,
}

const inputStyle = {
  flex: '1 1 220px',
  minWidth: 180,
  padding: '10px 12px',
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 14,
  color: colors.text,
  boxSizing: 'border-box',
}

const dateRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
  width: '100%',
}

const dateFieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: '1 1 160px',
  minWidth: 150,
}

const dateLabelStyle = {
  fontSize: 12,
  fontWeight: 500,
  color: colors.textMuted,
}

const dateInputStyle = {
  ...inputStyle,
  flex: 'none',
  width: '100%',
  minWidth: 0,
}

const filtersStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  width: '100%',
}

const filterChipStyle = (active) => ({
  padding: '6px 12px',
  border: 'none',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  color: active ? colors.triviaWhite : colors.text,
  background: active ? colors.triviaBlue : colors.bg,
})

const listContainerStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '0 20px',
}

const listStyle = {
  margin: 0,
  padding: '8px 0 20px',
  listStyle: 'none',
}

const itemStyle = (severity, dismissed) => ({
  display: 'grid',
  gridTemplateColumns: 'auto 140px 1fr auto',
  gap: '10px 14px',
  alignItems: 'start',
  padding: '12px 0',
  borderBottom: `1px solid ${colors.border}`,
  opacity: dismissed ? 0.55 : 1,
})

const timestampStyle = {
  margin: 0,
  fontSize: 12,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  color: colors.textMuted,
  whiteSpace: 'nowrap',
}

const itemTitleStyle = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: colors.text,
}

const itemMessageStyle = {
  margin: '3px 0 0',
  fontSize: 13,
  lineHeight: 1.45,
  color: colors.textMuted,
  wordBreak: 'break-word',
}

const itemMetaStyle = {
  margin: '4px 0 0',
  fontSize: 12,
  color: colors.textMuted,
}

const btnStyle = {
  padding: '10px 14px',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  color: colors.triviaWhite,
  background: colors.triviaBlue,
}

const btnSecondaryStyle = {
  ...btnStyle,
  color: colors.text,
  background: colors.bg,
  border: `1px solid ${colors.border}`,
}

const dismissBtnStyle = {
  flexShrink: 0,
  padding: '4px 8px',
  border: 'none',
  borderRadius: 6,
  background: 'transparent',
  color: colors.textMuted,
  fontSize: 18,
  lineHeight: 1,
  cursor: 'pointer',
}

const footerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 20px',
  borderTop: `1px solid ${colors.border}`,
  flexShrink: 0,
}

const dotStyle = (severity) => ({
  width: 10,
  height: 10,
  marginTop: 5,
  borderRadius: '50%',
  background: severityColors[severity] ?? severityColors[ERROR_SEVERITY.WARNING],
})

const FILTER_OPTIONS = [
  { id: 'all', label: 'Todos' },
  ...Object.values(ERROR_CATEGORY).map((id) => ({
    id,
    label: ERROR_CATEGORY_LABELS[id],
  })),
]

function getDominantSeverity(errors) {
  if (errors.some((e) => e.severity === ERROR_SEVERITY.ERROR)) {
    return ERROR_SEVERITY.ERROR
  }
  if (errors.some((e) => e.severity === ERROR_SEVERITY.WARNING)) {
    return ERROR_SEVERITY.WARNING
  }
  return ERROR_SEVERITY.INFO
}

function ErrorsModal({
  visibleCount,
  dominantSeverity,
  search,
  setSearch,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  category,
  setCategory,
  filteredErrors,
  visibleLimit,
  setVisibleLimit,
  dismissedIds,
  dismissOne,
  onDownload,
  onClearAll,
  onClose,
}) {
  const pagedErrors = filteredErrors.slice(0, visibleLimit)
  const hasMore = filteredErrors.length > visibleLimit

  return createPortal(
    <div
      style={modalOverlayStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Log de erros e alertas"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={countBadgeStyle(dominantSeverity)}>{visibleCount}</span>
          <h2 style={titleStyle}>Log de erros e alertas</h2>
        </div>
        <button type="button" style={dismissBtnStyle} onClick={onClose} aria-label="Fechar">
          ×
        </button>
      </div>

      <div style={toolbarStyle}>
        <input
          type="search"
          placeholder="Filtrar por texto ou horário…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setVisibleLimit(PAGE_SIZE)
          }}
          style={inputStyle}
        />

        <div style={dateRowStyle}>
          <label style={dateFieldStyle}>
            <span style={dateLabelStyle}>Data inicial</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setVisibleLimit(PAGE_SIZE)
              }}
              style={dateInputStyle}
            />
          </label>

          <label style={dateFieldStyle}>
            <span style={dateLabelStyle}>Data final</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setVisibleLimit(PAGE_SIZE)
              }}
              style={dateInputStyle}
            />
          </label>

          {(dateFrom || dateTo) && (
            <button
              type="button"
              style={{ ...btnSecondaryStyle, alignSelf: 'flex-end' }}
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                setVisibleLimit(PAGE_SIZE)
              }}
            >
              Limpar datas
            </button>
          )}
        </div>

        <div style={filtersStyle}>
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              style={filterChipStyle(category === option.id)}
              onClick={() => {
                setCategory(option.id)
                setVisibleLimit(PAGE_SIZE)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={listContainerStyle}>
        {filteredErrors.length === 0 ? (
          <p style={{ ...previewStyle, padding: '20px 0' }}>
            Nenhum item corresponde ao filtro.
          </p>
        ) : (
          <ul style={listStyle}>
            {pagedErrors.map((item) => (
              <li key={item.id} style={itemStyle(item.severity, dismissedIds.has(item.id))}>
                <span style={dotStyle(item.severity)} aria-hidden />
                <time style={timestampStyle} dateTime={new Date(item.createdAt).toISOString()}>
                  {formatLogTimestamp(item.createdAt)}
                </time>
                <div style={{ minWidth: 0 }}>
                  <p style={itemTitleStyle}>{item.title}</p>
                  {item.message && <p style={itemMessageStyle}>{item.message}</p>}
                  <p style={itemMetaStyle}>
                    {ERROR_CATEGORY_LABELS[item.category] ?? item.category}
                  </p>
                </div>
                <button
                  type="button"
                  style={dismissBtnStyle}
                  onClick={() => dismissOne(item.id)}
                  aria-label="Dispensar"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasMore && (
          <div style={{ textAlign: 'center', paddingBottom: 20 }}>
            <button
              type="button"
              style={btnSecondaryStyle}
              onClick={() => setVisibleLimit((limit) => limit + PAGE_SIZE)}
            >
              Carregar mais ({filteredErrors.length - visibleLimit} restantes)
            </button>
          </div>
        )}
      </div>

      <div style={footerStyle}>
        <span style={{ fontSize: 13, color: colors.textMuted }}>
          Exibindo {pagedErrors.length} de {filteredErrors.length} registros
          {visibleCount !== filteredErrors.length ? ` · ${visibleCount} no total` : ''}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            style={btnSecondaryStyle}
            onClick={onDownload}
            disabled={filteredErrors.length === 0}
          >
            Baixar .txt
          </button>
          <button type="button" style={btnStyle} onClick={onClose}>
            Fechar
          </button>
          <button type="button" style={btnSecondaryStyle} onClick={onClearAll}>
            Limpar log
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function ErrorsPanel({ errors = [], onClearAll }) {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [category, setCategory] = useState('all')
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE)
  const [dismissedIds, setDismissedIds] = useState(() => new Set())

  const activeErrors = useMemo(
    () => errors.filter((item) => !dismissedIds.has(item.id)),
    [errors, dismissedIds],
  )

  const filteredErrors = useMemo(() => {
    const filtered = filterMonitoringErrors(errors, {
      search,
      category,
      dateFrom,
      dateTo,
      formatTimestamp: formatLogTimestamp,
    })
    return [...filtered].reverse()
  }, [errors, search, category, dateFrom, dateTo])

  const latestError = errors[errors.length - 1] ?? null
  const dominantSeverity = getDominantSeverity(activeErrors.length > 0 ? activeErrors : errors)

  useEffect(() => {
    if (!expanded) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event) {
      if (event.key === 'Escape') setExpanded(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded])

  if (errors.length === 0) return null

  function dismissOne(id) {
    setDismissedIds((prev) => new Set([...prev, id]))
  }

  function handleClearAll() {
    setDismissedIds(new Set())
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setCategory('all')
    setVisibleLimit(PAGE_SIZE)
    setExpanded(false)
    onClearAll?.()
  }

  function openModal() {
    setVisibleLimit(PAGE_SIZE)
    setExpanded(true)
  }

  function handleDownload() {
    const chronological = [...filteredErrors].reverse()
    downloadErrorLogTxt(chronological, { formatTimestamp: formatLogTimestamp })
  }

  return (
    <>
      {!expanded && (
        <div
          style={widgetStyle}
          role="region"
          aria-label="Erros do monitoramento"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div style={{ ...bodyPadding, paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={countBadgeStyle(dominantSeverity)}>
                {activeErrors.length || errors.length}
              </span>
              <strong style={{ fontSize: 14, color: colors.text }}>
                {errors.length === 1 ? '1 registro no log' : `${errors.length} registros no log`}
              </strong>
            </div>

            {latestError && (
              <p style={previewStyle}>
                <span style={{ ...timestampStyle, display: 'block', marginBottom: 4 }}>
                  {formatLogTimestamp(latestError.createdAt)}
                </span>
                <strong style={{ color: colors.text }}>{latestError.title}</strong>
                {latestError.message ? ` — ${latestError.message}` : ''}
              </p>
            )}

            <button type="button" style={{ ...btnStyle, width: '100%' }} onClick={openModal}>
              Visualizar todos
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <ErrorsModal
          visibleCount={errors.length}
          dominantSeverity={dominantSeverity}
          search={search}
          setSearch={setSearch}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          category={category}
          setCategory={setCategory}
          filteredErrors={filteredErrors}
          visibleLimit={visibleLimit}
          setVisibleLimit={setVisibleLimit}
          dismissedIds={dismissedIds}
          dismissOne={dismissOne}
          onDownload={handleDownload}
          onClearAll={handleClearAll}
          onClose={() => setExpanded(false)}
        />
      )}
    </>
  )
}
