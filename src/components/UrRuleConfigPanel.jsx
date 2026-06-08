import { useEffect, useMemo, useState } from 'react'
import { FIBER_CONFIG_FILE_PATH } from '../fibers/fiberNetwork'
import { UR_CABLE_ID_PATTERN } from '../urs/urRules'
import { colors } from '../styles/tokens'

const panelStyle = {
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 30,
  width: 'min(320px, calc(100vw - 120px))',
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
  padding: 16,
  borderRadius: 12,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  boxShadow: '0 8px 24px rgba(18, 20, 26, 0.15)',
  pointerEvents: 'auto',
}

const titleStyle = {
  margin: '0 0 8px',
  fontSize: 15,
  fontWeight: 600,
  color: colors.text,
}

const hintStyle = {
  margin: '0 0 12px',
  fontSize: 12,
  color: colors.textMuted,
  lineHeight: 1.4,
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  marginBottom: 12,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 14,
  color: colors.text,
  boxSizing: 'border-box',
}

const listStyle = {
  maxHeight: 200,
  overflowY: 'auto',
  marginBottom: 12,
  paddingRight: 4,
}

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 8,
  fontSize: 13,
  color: colors.text,
  cursor: 'pointer',
}

const badgeStyle = {
  display: 'inline-block',
  marginBottom: 12,
  padding: '6px 12px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  color: colors.triviaWhite,
  background: colors.triviaBlue,
}

const btnStyle = (primary) => ({
  width: '100%',
  padding: '8px 12px',
  border: primary ? 'none' : `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  color: primary ? colors.triviaWhite : colors.text,
  background: primary ? colors.triviaBlue : colors.surface,
})

function caboSortKey(id) {
  const ur = id.match(/^cabo-ur-(\d+)$/)
  if (ur) return 1000 + Number(ur[1])
  const n = Number(String(id).replace('cabo-', ''))
  return Number.isFinite(n) ? n : 0
}

export function UrRuleConfigPanel({
  visible,
  urNumber,
  rule,
  cableOptions = [],
  networkLoading,
  saveError,
  onSave,
  onClose,
}) {
  const [habilitado, setHabilitado] = useState(false)
  const [minCabosVermelhos, setMinCabosVermelhos] = useState(2)
  const [cabos, setCabos] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    setHabilitado(Boolean(rule?.habilitado))
    setMinCabosVermelhos(rule?.minCabosVermelhos ?? 2)
    setCabos(rule?.cabos ? [...rule.cabos] : [])
    setSearch('')
  }, [rule, urNumber])

  const sortedOptions = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = [...cableOptions].sort((a, b) => caboSortKey(a) - caboSortKey(b))
    if (!term) return list
    return list.filter((id) => id.toLowerCase().includes(term))
  }, [cableOptions, search])

  if (!visible) return null

  if (networkLoading) {
    return (
      <aside style={panelStyle} onPointerDown={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>Configurar UR</h2>
        <p style={hintStyle}>Carregando {FIBER_CONFIG_FILE_PATH}…</p>
      </aside>
    )
  }

  if (!urNumber) {
    return (
      <aside style={panelStyle} onPointerDown={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>Configurar UR</h2>
        <p style={hintStyle}>
          Clique em um botão UR no diagrama (btn-ur-N) para definir quando a UR
          cai por cabos vermelhos.
        </p>
        <button type="button" style={btnStyle(false)} onClick={onClose}>
          Fechar
        </button>
      </aside>
    )
  }

  function toggleCabo(id) {
    setCabos((prev) => {
      const set = new Set(prev)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return [...set]
    })
  }

  function handleSave() {
    onSave?.(urNumber, {
      habilitado,
      minCabosVermelhos: Number(minCabosVermelhos) || 2,
      cabos,
    })
  }

  return (
    <aside style={panelStyle} onPointerDown={(e) => e.stopPropagation()}>
      <h2 style={titleStyle}>Configurar UR</h2>
      <p style={hintStyle}>
        Quando <strong>{minCabosVermelhos}</strong> ou mais cabos marcados
        abaixo estiverem vermelhos na simulação, a UR desconecta automaticamente.
        Salvo em {FIBER_CONFIG_FILE_PATH}.
      </p>

      <span style={badgeStyle}>UR {urNumber}</span>

      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          checked={habilitado}
          onChange={(e) => setHabilitado(e.target.checked)}
        />
        Regra ativa (cair por fibra vermelha)
      </label>

      <label style={{ ...hintStyle, display: 'block', marginBottom: 4 }}>
        Mínimo de cabos vermelhos
      </label>
      <input
        type="number"
        min={1}
        max={20}
        value={minCabosVermelhos}
        onChange={(e) => setMinCabosVermelhos(e.target.value)}
        style={inputStyle}
      />

      <label style={{ ...hintStyle, display: 'block', marginBottom: 4 }}>
        Cabos monitorados
      </label>
      <input
        type="search"
        placeholder="Buscar cabo…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputStyle}
      />

      <div style={listStyle}>
        {sortedOptions.length === 0 && (
          <p style={hintStyle}>Nenhum cabo encontrado no diagrama.</p>
        )}
        {sortedOptions.map((id) => (
          <label key={id} style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={cabos.includes(id)}
              onChange={() => toggleCabo(id)}
            />
            {id}
            {UR_CABLE_ID_PATTERN.test(id) && (
              <span style={{ fontSize: 11, color: colors.textMuted }}>
                (fibra UR)
              </span>
            )}
          </label>
        ))}
      </div>

      <button type="button" style={btnStyle(true)} onClick={handleSave}>
        Salvar regra UR
      </button>
      <button
        type="button"
        style={{ ...btnStyle(false), marginTop: 8 }}
        onClick={onClose}
      >
        Fechar
      </button>
    </aside>
  )
}
