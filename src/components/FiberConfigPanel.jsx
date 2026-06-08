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

function caboSortKey(id) {
  const n = Number(String(id).replace('cabo-', ''))
  return Number.isFinite(n) ? n : 0
}

/** Selecionados primeiro; dentro de cada grupo, ordem numérica do cabo. */
function sortWithSelectedFirst(ids, selected) {
  const selectedSet = new Set(selected)
  return [...ids].sort((a, b) => {
    const aSel = selectedSet.has(a)
    const bSel = selectedSet.has(b)
    if (aSel !== bSel) return aSel ? -1 : 1
    return caboSortKey(a) - caboSortKey(b)
  })
}

function RadioCheckboxGroup({ title, options, selected, onToggle }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ ...sectionTitleStyle, marginBottom: 6 }}>{title}</p>
      <div style={radiosListStyle}>
        {sortWithSelectedFirst(
          options.map((o) => o.id),
          selected,
        ).map((id) => {
          const option = options.find((o) => o.id === id)
          if (!option) return null
          return (
          <label key={id} style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={selected.includes(id)}
              onChange={() => onToggle(id)}
            />
            {option.label ?? id}
          </label>
          )
        })}
      </div>
    </div>
  )
}

function FiberCheckboxList({
  title,
  hint,
  fiberIds,
  selected,
  onToggle,
  search,
  onSearchChange,
}) {
  const filteredFiberIds = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term
      ? fiberIds.filter((id) => {
          const number = id.replace('cabo-', '')
          return id.toLowerCase().includes(term) || number.includes(term)
        })
      : fiberIds

    return sortWithSelectedFirst(filtered, selected)
  }, [fiberIds, search, selected])

  return (
    <section style={{ marginBottom: 16 }}>
      <p style={sectionTitleStyle}>{title}</p>
      {hint && <p style={{ ...hintStyle, marginTop: 0 }}>{hint}</p>}

      <input
        type="search"
        style={inputStyle}
        placeholder="Buscar número (ex: 38, 7, 61)"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <div style={listStyle}>
        {filteredFiberIds.length === 0 && (
          <p style={hintStyle}>
            Nenhum cabo encontrado{search ? ` para "${search}"` : ''}.
          </p>
        )}

        {filteredFiberIds.map((id) => (
          <label key={id} style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={selected.includes(id)}
              onChange={() => onToggle(id)}
            />
            {id}
          </label>
        ))}
      </div>
    </section>
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
    () => network.links.find((item) => item?.id === linkId) ?? null,
    [network.links, linkId],
  )

  const [ida, setIda] = useState([])
  const [volta, setVolta] = useState([])
  const [fim, setFim] = useState(false)
  const [radios, setRadios] = useState(() => createEmptyRadios())
  const [searchIda, setSearchIda] = useState('')
  const [searchVolta, setSearchVolta] = useState('')

  const otherFiberIds = useMemo(
    () => fiberIds.filter((id) => id !== linkId),
    [fiberIds, linkId],
  )

  useEffect(() => {
    const idaList =
      link?.ida?.length > 0 ? link.ida : link?.derruba ? [...link.derruba] : []
    setIda([...idaList])
    setVolta(link?.volta ? [...link.volta] : [])
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
    setSearchIda('')
    setSearchVolta('')
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

  function toggleList(setter, id) {
    setter((prev) => {
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
    onSave(linkId, { ida, volta, fim, radios })
  }

  if (!linkId) {
    return (
      <aside style={panelStyle} onPointerDown={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>Configurar fibra</h2>
        <p style={hintStyle}>
          Clique em um <strong>cabo</strong> para ida/volta, ou em um botão{' '}
          <strong>UR</strong> (painel à esquerda) para regra de queda por fibras
          vermelhas.
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
        Cabo <strong>#{caboNumber}</strong> — marque os cabos da <strong>ida</strong>{' '}
        (cascata até o fim) e da <strong>volta</strong> (retorno). Na volta, se algum
        cabo anterior já estiver caído, da origem até ele ficam vermelhos.
        <br />
        {ida.length} ida · {volta.length} volta · {FIBER_CONFIG_FILE_PATH}
      </p>

      <div style={fimBoxStyle}>
        <label style={{ ...checkboxLabelStyle, marginBottom: 0 }}>
          <input
            type="checkbox"
            checked={fim}
            onChange={(e) => setFim(e.target.checked)}
          />
          <strong>Fim?</strong> — ponto final desta ramificação (a cascata para no
          primeiro encontrado)
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

      <FiberCheckboxList
        title="Ida"
        hint="Próximos cabos quando a cascata passa por este cabo (sentido até o Fim?)."
        fiberIds={otherFiberIds}
        selected={ida}
        onToggle={(id) => toggleList(setIda, id)}
        search={searchIda}
        onSearchChange={setSearchIda}
      />

      <FiberCheckboxList
        title="Volta"
        hint="Cabo(s) do retorno em verde após o fim — ordem do fim de volta até a origem."
        fiberIds={otherFiberIds}
        selected={volta}
        onToggle={(id) => toggleList(setVolta, id)}
        search={searchVolta}
        onSearchChange={setSearchVolta}
      />

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
