import { useEffect, useMemo, useState } from 'react'
import { FIBER_CONFIG_FILE_PATH } from '../fibers/fiberNetwork'
import { createEmptyRadios } from '../radios/radios'
import { colors } from '../styles/tokens'

const panelStyle = {
  position: 'absolute',
  top: 16,
  right: 80,
  zIndex: 30,
  width: 'min(340px, calc(100vw - 120px))',
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
  margin: '0 0 12px',
  fontSize: 15,
  fontWeight: 600,
  color: colors.text,
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
  maxHeight: 280,
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

const rowStyle = {
  display: 'flex',
  gap: 8,
  marginTop: 8,
}

const btnStyle = (primary) => ({
  flex: 1,
  padding: '8px 12px',
  border: primary ? 'none' : `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  color: primary ? colors.triviaWhite : colors.text,
  background: primary ? colors.triviaBlue : colors.surface,
})

const hintStyle = {
  margin: '0 0 12px',
  fontSize: 12,
  color: colors.textMuted,
  lineHeight: 1.4,
}

const sectionTitleStyle = {
  margin: '0 0 8px',
  fontSize: 12,
  fontWeight: 600,
  color: colors.textMuted,
}

const caboBadgeStyle = {
  display: 'inline-block',
  marginBottom: 12,
  padding: '6px 12px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  color: colors.triviaWhite,
  background: colors.triviaBlue,
}

const fimBoxStyle = {
  marginBottom: 12,
  padding: 10,
  borderRadius: 8,
  background: colors.bg,
  border: `1px solid ${colors.border}`,
}

const radiosListStyle = {
  maxHeight: 140,
  overflowY: 'auto',
  marginBottom: 8,
}

function RadioCheckboxGroup({ title, options, selected, onToggle }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ ...sectionTitleStyle, marginBottom: 6 }}>{title}</p>
      <div style={radiosListStyle}>
        {options.map(({ id, label }) => (
          <label key={id} style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={selected.includes(id)}
              onChange={() => onToggle(id)}
            />
            {label ?? id}
          </label>
        ))}
      </div>
    </div>
  )
}

export function FiberConfigPanel({
  visible,
  linkId,
  network,
  fiberIds,
  networkLoading,
  saveError,
  onSave,
  onClose,
  onTestDrop,
  radioLineOptions = [],
  torreTextoOptions = [],
  torreImgOptions = [],
}) {
  const link = useMemo(
    () => network.links.find((item) => item.id === linkId) ?? null,
    [network.links, linkId],
  )

  const [derruba, setDerruba] = useState([])
  const [fim, setFim] = useState(false)
  const [radios, setRadios] = useState(() => createEmptyRadios())
  const [search, setSearch] = useState('')

  const otherFiberIds = useMemo(
    () => fiberIds.filter((id) => id !== linkId),
    [fiberIds, linkId],
  )

  const filteredFiberIds = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return otherFiberIds

    return otherFiberIds.filter((id) => {
      const number = id.replace('cabo-', '')
      return id.toLowerCase().includes(term) || number.includes(term)
    })
  }, [otherFiberIds, search])

  useEffect(() => {
    setDerruba(link?.derruba ? [...link.derruba] : [])
    setFim(Boolean(link?.fim))
    setRadios(
      link?.radios
        ? {
            lines: [...(link.radios.lines ?? [])],
            textos: [...(link.radios.textos ?? [])],
            imgs: [...(link.radios.imgs ?? [])],
          }
        : createEmptyRadios(),
    )
    setSearch('')
  }, [link, linkId])

  if (!visible) return null

  if (networkLoading) {
    return (
      <aside style={panelStyle} onPointerDown={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>Configurar fibra</h2>
        <p style={hintStyle}>Carregando {FIBER_CONFIG_FILE_PATH}…</p>
      </aside>
    )
  }

  function toggleDerruba(id) {
    setDerruba((prev) => {
      const list = new Set(prev)
      if (list.has(id)) list.delete(id)
      else list.add(id)
      return [...list]
    })
  }

  function toggleRadioList(key, id) {
    setRadios((prev) => {
      const list = new Set(prev[key])
      if (list.has(id)) list.delete(id)
      else list.add(id)
      return { ...prev, [key]: [...list] }
    })
  }

  function handleSave() {
    if (!linkId) return
    onSave(linkId, { derruba, fim, radios })
  }

  if (!linkId) {
    return (
      <aside style={panelStyle} onPointerDown={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>Configurar fibra</h2>
        <p style={hintStyle}>
          Clique em um cabo no diagrama. Marque <strong>Fim?</strong> no cabo onde a
          cascata deve parar e voltar em verde.
        </p>
      </aside>
    )
  }

  const caboNumber = linkId.replace('cabo-', '')

  return (
    <aside style={panelStyle} onPointerDown={(e) => e.stopPropagation()}>
      <h2 style={titleStyle}>Configurar fibra</h2>

      <span style={caboBadgeStyle}>{linkId}</span>

      <p style={hintStyle}>
        Cabo <strong>#{caboNumber}</strong> — cascata vermelha até o <strong>Fim?</strong>,
        depois volta em verde (reversa) e só este cabo origem fica vermelho.
        <br />
        {derruba.length} derruba · {FIBER_CONFIG_FILE_PATH}
      </p>

      {saveError && <p style={{ ...hintStyle, color: '#c62828' }}>{saveError}</p>}

      <div style={fimBoxStyle}>
        <label style={{ ...checkboxLabelStyle, marginBottom: 0 }}>
          <input
            type="checkbox"
            checked={fim}
            onChange={(e) => setFim(e.target.checked)}
          />
          <strong>Fim?</strong> — ponto final desta ramificação (pode haver vários; a cascata para no primeiro encontrado)
        </label>
      </div>

      {fim && (
        <>
          <p style={sectionTitleStyle}>Rádios evidentes ao chegar no fim</p>
          <p style={{ ...hintStyle, marginTop: 0 }}>
            Se nenhum for marcado, todos os rádios e torres ficam evidentes.
          </p>
          <RadioCheckboxGroup
            title="Linhas"
            options={radioLineOptions}
            selected={radios.lines}
            onToggle={(id) => toggleRadioList('lines', id)}
          />
          <RadioCheckboxGroup
            title="Texto da torre"
            options={torreTextoOptions}
            selected={radios.textos}
            onToggle={(id) => toggleRadioList('textos', id)}
          />
          <RadioCheckboxGroup
            title="Imagem da torre"
            options={torreImgOptions}
            selected={radios.imgs}
            onToggle={(id) => toggleRadioList('imgs', id)}
          />
        </>
      )}

      <p style={sectionTitleStyle}>Quando cair, Derruba (Manual)</p>

      <input
        type="search"
        style={inputStyle}
        placeholder="Buscar número (ex: 38, 7, 61)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={listStyle}>
        {filteredFiberIds.length === 0 && (
          <p style={hintStyle}>Nenhum cabo encontrado para &quot;{search}&quot;.</p>
        )}

        {filteredFiberIds.map((id) => (
          <label key={id} style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={derruba.includes(id)}
              onChange={() => toggleDerruba(id)}
            />
            {id}
          </label>
        ))}
      </div>

      <div style={rowStyle}>
        <button type="button" style={btnStyle(true)} onClick={handleSave}>
          Salvar
        </button>
        <button type="button" style={btnStyle(false)} onClick={() => onTestDrop(linkId)}>
          Testar queda
        </button>
      </div>

      <button
        type="button"
        style={{ ...btnStyle(false), width: '100%', marginTop: 8 }}
        onClick={onClose}
      >
        Fechar
      </button>
    </aside>
  )
}
