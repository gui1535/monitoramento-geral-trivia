import { useMemo, useState } from 'react'
import { FIBER_STATUS } from '../fibers/fibers'
import { LED_SIDES, LED_STATUS } from '../leds/leds'
import { UrEnergyIconBadge } from '../urs/UrEnergyIconBadge'
import { UR_ENERGY_TYPE } from '../urs/urEnergyIcon.constants'
import { UR_NUMBERS } from '../urs/urs'
import { colors } from '../styles/tokens'

const fabStyle = {
  position: 'absolute',
  top: 58,
  right: 16,
  zIndex: 30,
  padding: '10px 14px',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  color: colors.triviaWhite,
  background: colors.triviaBlue,
  boxShadow: '0 2px 8px rgba(18, 20, 26, 0.2)',
  cursor: 'pointer',
  pointerEvents: 'auto',
}

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  background: 'rgba(18, 20, 26, 0.45)',
  pointerEvents: 'auto',
}

const modalStyle = {
  width: 'min(380px, 100%)',
  padding: 20,
  borderRadius: 12,
  background: colors.surface,
  boxShadow: '0 12px 40px rgba(18, 20, 26, 0.2)',
}

const titleStyle = {
  margin: '0 0 12px',
  fontSize: 16,
  fontWeight: 600,
  color: colors.text,
}

const tabsStyle = {
  display: 'flex',
  gap: 6,
  marginBottom: 14,
}

const tabStyle = (active) => ({
  flex: 1,
  padding: '8px 6px',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  color: active ? colors.triviaWhite : colors.text,
  background: active ? colors.triviaBlue : colors.bg,
})

const pairRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 12,
  paddingBottom: 12,
  borderBottom: `1px solid ${colors.border}`,
  fontSize: 13,
  color: colors.text,
}

const pairLabelStyle = {
  fontWeight: 600,
  fontSize: 12,
  color: colors.textMuted,
}

const ledSideRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
}

const ledSideNameStyle = {
  minWidth: 72,
  fontSize: 12,
}

const ledChoiceBtnStyle = (active, variant) => ({
  padding: '4px 10px',
  border: `1px solid ${active ? colors.triviaBlue : colors.border}`,
  borderRadius: 6,
  fontSize: 12,
  fontWeight: active ? 600 : 400,
  cursor: 'pointer',
  color: active ? colors.triviaWhite : colors.text,
  background:
    active && variant === 'ok'
      ? '#18B44A'
      : active && variant === 'fail'
        ? '#C9A800'
        : colors.surface,
})

function LedSideControl({ label, value, onSelect }) {
  return (
    <div style={ledSideRowStyle}>
      <span style={ledSideNameStyle}>{label}</span>
      <button
        type="button"
        style={ledChoiceBtnStyle(value === 'ok', 'ok')}
        onClick={() => onSelect('ok')}
      >
        OK
      </button>
      <button
        type="button"
        style={ledChoiceBtnStyle(value === 'not_ok', 'fail')}
        onClick={() => onSelect('not_ok')}
      >
        Não OK
      </button>
    </div>
  )
}

const searchStyle = {
  width: '100%',
  padding: '8px 10px',
  marginBottom: 10,
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

const rowActionsStyle = {
  display: 'flex',
  gap: 8,
  marginBottom: 10,
  fontSize: 12,
}

const linkBtnStyle = {
  padding: 0,
  border: 'none',
  background: 'none',
  color: colors.triviaBlue,
  cursor: 'pointer',
  fontSize: 12,
}

const simulateBtnStyle = (disabled) => ({
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  color: colors.triviaWhite,
  background: disabled ? colors.border : colors.triviaBlue,
  cursor: disabled ? 'not-allowed' : 'pointer',
})

const secondaryBtnStyle = {
  width: '100%',
  marginTop: 8,
  padding: '8px 14px',
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 13,
  color: colors.text,
  background: colors.surface,
  cursor: 'pointer',
}

const hintStyle = {
  margin: '0 0 12px',
  fontSize: 12,
  color: colors.textMuted,
  lineHeight: 1.4,
}

const emptyStyle = {
  margin: '12px 0',
  fontSize: 13,
  color: colors.textMuted,
}

const sectionTitleStyle = {
  margin: '0 0 8px',
  fontSize: 12,
  fontWeight: 600,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const sectionStyle = {
  marginBottom: 14,
}

const radioListStyle = {
  maxHeight: 120,
  overflowY: 'auto',
  marginBottom: 0,
  paddingRight: 4,
}

function CheckboxGroup({ title, options, selected, onToggle }) {
  return (
    <section style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      <div style={radioListStyle}>
        {options.map((option) => (
          <label key={option.id} style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={selected.has(option.id)}
              onChange={() => onToggle(option.id)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </section>
  )
}

function TestModal({
  open,
  onClose,
  setFibers,
  fiberIds,
  cableIdLabelsVisible,
  setCableIdLabelsVisible,
  setLeds,
  ledPairs,
  applyVisibility,
  radioLineOptions,
  torreTextoOptions,
  torreImgOptions,
  resetRadios,
  network,
  onSimulateFiberDrop,
  onClearFiberSimulation,
  onExportNetwork,
  onImportNetwork,
  getAfetadosPreview,
  onLoadExampleNetwork,
  semEnergiaPorUr = {},
  onSetUrSemEnergia,
  onClearUrSemEnergia,
}) {
  const [tab, setTab] = useState('fibra')
  const [selectedUr, setSelectedUr] = useState(2)
  const [urSearch, setUrSearch] = useState('')
  const [selectedFibers, setSelectedFibers] = useState(() => new Set())
  const [afetadosPreview, setAfetadosPreview] = useState(null)
  const [ledSideStates, setLedSideStates] = useState(() => new Map())
  const [selectedLines, setSelectedLines] = useState(() => new Set())
  const [selectedTextos, setSelectedTextos] = useState(() => new Set())
  const [selectedImgs, setSelectedImgs] = useState(() => new Set())
  const [fiberSearch, setFiberSearch] = useState('')

  const filteredFiberIds = useMemo(() => {
    const term = fiberSearch.trim().toLowerCase()
    if (!term) return fiberIds
    return fiberIds.filter((id) => id.toLowerCase().includes(term))
  }, [fiberIds, fiberSearch])

  const filteredUrNumbers = useMemo(() => {
    const term = urSearch.trim()
    if (!term) return UR_NUMBERS
    return UR_NUMBERS.filter((n) => String(n).includes(term))
  }, [urSearch])

  const selectedUrTipos = semEnergiaPorUr[selectedUr] ?? []
  const selectedUrFalta1 = selectedUrTipos.includes(UR_ENERGY_TYPE.FALTA_1)
  const selectedUrFalta2 = selectedUrTipos.includes(UR_ENERGY_TYPE.FALTA_2)
  const totalSemEnergia = Object.keys(semEnergiaPorUr).length

  if (!open) return null

  function close() {
    setSelectedFibers(new Set())
    setLedSideStates(new Map())
    setSelectedLines(new Set())
    setSelectedTextos(new Set())
    setSelectedImgs(new Set())
    setFiberSearch('')
    setUrSearch('')
    setSelectedUr(2)
    setTab('fibra')
    onClose()
  }

  function getLedSideKey(pairIndex, side) {
    return `${pairIndex}-${side}`
  }

  function setLedSideState(pairIndex, side, status) {
    setLedSideStates((prev) => {
      const next = new Map(prev)
      next.set(getLedSideKey(pairIndex, side), status)
      return next
    })
  }

  function getLedSideState(pairIndex, side) {
    return ledSideStates.get(getLedSideKey(pairIndex, side)) ?? null
  }

  function toggleFiber(id) {
    setSelectedFibers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleId(setter, id) {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSimulateFibers() {
    if (selectedFibers.size === 0) return

    onSimulateFiberDrop?.([...selectedFibers])
    close()
  }

  function handleClearSimulation() {
    onClearFiberSimulation?.()
    setAfetadosPreview(null)
  }

  function handlePreviewAfetados() {
    if (selectedFibers.size === 0) {
      setAfetadosPreview(null)
      return
    }

    const results = [...selectedFibers].map((id) => getAfetadosPreview(id))
    const cabos = new Set()
    const nodes = new Set()

    results.forEach((result) => {
      result.cabos.forEach((c) => cabos.add(c))
      result.nodes.forEach((n) => nodes.add(n))
    })

    setAfetadosPreview({
      cabos: [...cabos],
      nodes: [...nodes],
      ordem: results.flatMap((r) => r.ordem ?? r.cabos),
      ordemVolta: results.flatMap((r) => r.ordemVolta ?? []),
      raiz: results[0]?.raiz ?? null,
    })
  }

  function handleExportJson() {
    const json = onExportNetwork?.()
    if (!json) return

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'config-fibra.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function handleImportJson(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        onImportNetwork?.(String(reader.result))
        alert('JSON importado e salvo.')
      } catch {
        alert('JSON inválido.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const hasLedSelection = ledSideStates.size > 0

  const hasRadioSelection =
    selectedLines.size > 0 || selectedTextos.size > 0 || selectedImgs.size > 0

  function handleApplyLeds() {
    if (!hasLedSelection) return

    const byPair = new Map()

    ledSideStates.forEach((status, key) => {
      const [pairIndexRaw, side] = key.split('-')
      const pairIndex = Number(pairIndexRaw)
      if (!pairIndex || !side) return

      const current = byPair.get(pairIndex) ?? { pairIndex }
      current[side.toLowerCase()] =
        status === 'ok' ? LED_STATUS.OK : LED_STATUS.NOT_OK
      byPair.set(pairIndex, current)
    })

    setLeds([...byPair.values()])
    close()
  }

  function handleApplyVisibility() {
    if (!hasRadioSelection) return

    applyVisibility({
      lines: [...selectedLines],
      textos: [...selectedTextos],
      imgs: [...selectedImgs],
    })
    close()
  }

  function handleResetRadios() {
    resetRadios()
    setSelectedLines(new Set())
    setSelectedTextos(new Set())
    setSelectedImgs(new Set())
  }

  return (
    <div
      style={backdropStyle}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={close}
      role="presentation"
    >
      <div
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 style={titleStyle}>Teste</h2>

        <div style={tabsStyle}>
          <button
            type="button"
            style={tabStyle(tab === 'fibra')}
            onClick={() => setTab('fibra')}
          >
            Queda de fibra
          </button>
          <button
            type="button"
            style={tabStyle(tab === 'radio')}
            onClick={() => setTab('radio')}
          >
            Rádio
          </button>
          <button
            type="button"
            style={tabStyle(tab === 'led')}
            onClick={() => setTab('led')}
          >
            LEDs
          </button>
          <button
            type="button"
            style={tabStyle(tab === 'ur')}
            onClick={() => setTab('ur')}
          >
            UR
          </button>
        </div>

        {tab === 'fibra' && (
          <>
            <label style={{ ...checkboxLabelStyle, marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={cableIdLabelsVisible}
                onChange={(e) => setCableIdLabelsVisible(e.target.checked)}
              />
              Mostrar ID no cabo (teste)
            </label>

            <input
              type="search"
              placeholder="Buscar cabo (ex: 12)"
              value={fiberSearch}
              onChange={(e) => setFiberSearch(e.target.value)}
              style={searchStyle}
            />

            <div style={rowActionsStyle}>
              <button
                type="button"
                style={linkBtnStyle}
                onClick={() =>
                  setSelectedFibers((prev) => new Set([...prev, ...filteredFiberIds]))
                }
              >
                Marcar visíveis
              </button>
              <button
                type="button"
                style={linkBtnStyle}
                onClick={() => setSelectedFibers(new Set())}
              >
                Limpar
              </button>
              <span style={{ marginLeft: 'auto', color: colors.textMuted }}>
                {selectedFibers.size} selecionado(s)
              </span>
            </div>

            <div style={listStyle}>
              {fiberIds.length === 0 && (
                <p style={emptyStyle}>Carregando cabos…</p>
              )}

              {filteredFiberIds.map((id) => (
                <label key={id} style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={selectedFibers.has(id)}
                    onChange={() => toggleFiber(id)}
                  />
                  #{id}
                </label>
              ))}
            </div>

            <p style={hintStyle}>
              Na volta, cabos que já estavam caídos estendem o vermelho da origem até
              eles; o restante do caminho fica verde. Rádios no fim ficam evidentes.
            </p>

            <div style={rowActionsStyle}>
              <button type="button" style={linkBtnStyle} onClick={handlePreviewAfetados}>
                Ver afetados
              </button>
              <span style={{ marginLeft: 'auto', color: colors.textMuted }}>
                {network.links.filter((l) => l.from && l.to).length} cabos configurados
              </span>
            </div>

            {afetadosPreview && (
              <p style={{ ...hintStyle, marginBottom: 12 }}>
                Ida: {afetadosPreview.ordem?.join(' → ') || '—'}
                {afetadosPreview.ordemVolta?.length > 0 && (
                  <>
                    <br />
                    Volta: {afetadosPreview.ordemVolta.join(' → ')}
                  </>
                )}
                {afetadosPreview.raiz && (
                  <>
                    <br />
                    Fica vermelho: {afetadosPreview.raiz}
                  </>
                )}
              </p>
            )}

            <button
              type="button"
              style={simulateBtnStyle(selectedFibers.size === 0)}
              disabled={selectedFibers.size === 0}
              onClick={handleSimulateFibers}
            >
              Simular queda em cascata
            </button>

            <button
              type="button"
              style={secondaryBtnStyle}
              onClick={handleClearSimulation}
            >
              Limpar simulação
            </button>

            <div style={rowActionsStyle}>
              <button type="button" style={linkBtnStyle} onClick={handleExportJson}>
                Exportar JSON
              </button>
              <label style={{ ...linkBtnStyle, cursor: 'pointer' }}>
                Importar JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  style={{ display: 'none' }}
                  onChange={handleImportJson}
                />
              </label>
            </div>

            <button
              type="button"
              style={{ ...secondaryBtnStyle, marginTop: 0 }}
              onClick={() => {
                onLoadExampleNetwork?.()
                alert('Exemplo gravado em data/config-fibra.json.')
              }}
            >
              Carregar exemplo do guia
            </button>
          </>
        )}

        {tab === 'led' && (
          <>
            <p style={hintStyle}>
              <strong>OK</strong> — verde fixo. <strong>Não OK</strong> — amarelo
              piscando. Ímpar = A, par = B (led-1/2 … led-17/18).
            </p>

            <div style={{ ...listStyle, maxHeight: 360 }}>
              {ledPairs.map((pair) => (
                <div key={pair.pairIndex} style={pairRowStyle}>
                  <span style={pairLabelStyle}>Par {pair.pairIndex}</span>
                  <LedSideControl
                    label={`A (${pair.a.id})`}
                    value={getLedSideState(pair.pairIndex, LED_SIDES.A)}
                    onSelect={(status) =>
                      setLedSideState(pair.pairIndex, LED_SIDES.A, status)
                    }
                  />
                  <LedSideControl
                    label={`B (${pair.b.id})`}
                    value={getLedSideState(pair.pairIndex, LED_SIDES.B)}
                    onSelect={(status) =>
                      setLedSideState(pair.pairIndex, LED_SIDES.B, status)
                    }
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              style={simulateBtnStyle(!hasLedSelection)}
              disabled={!hasLedSelection}
              onClick={handleApplyLeds}
            >
              Aplicar LEDs
            </button>
          </>
        )}

        {tab === 'ur' && (
          <>
            <p style={hintStyle}>
              Selecione a UR. <strong>Falta energia 1</strong> (esquerda) e{' '}
              <strong>Falta energia 2</strong> (direita) podem aparecer juntas.
            </p>

            <input
              type="search"
              placeholder="Buscar UR (ex: 12)"
              value={urSearch}
              onChange={(e) => setUrSearch(e.target.value)}
              style={searchStyle}
            />

            <div style={listStyle}>
              {filteredUrNumbers.map((numero) => {
                const selected = selectedUr === numero
                const tipos = semEnergiaPorUr[numero] ?? []
                return (
                  <label
                    key={numero}
                    style={{
                      ...checkboxLabelStyle,
                      padding: '6px 8px',
                      borderRadius: 8,
                      background: selected ? colors.bg : 'transparent',
                      border: selected
                        ? `1px solid ${colors.border}`
                        : '1px solid transparent',
                    }}
                    onClick={() => setSelectedUr(numero)}
                  >
                    <input
                      type="radio"
                      name="ur-teste"
                      checked={selected}
                      onChange={() => setSelectedUr(numero)}
                    />
                    UR {numero}
                    {tipos.length > 0 && (
                      <span
                        style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}
                      >
                        {tipos.includes(UR_ENERGY_TYPE.FALTA_1) && (
                          <UrEnergyIconBadge size={20} />
                        )}
                        {tipos.includes(UR_ENERGY_TYPE.FALTA_2) && (
                          <UrEnergyIconBadge size={20} />
                        )}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={selectedUrFalta1}
                onChange={(e) =>
                  onSetUrSemEnergia?.(
                    selectedUr,
                    UR_ENERGY_TYPE.FALTA_1,
                    e.target.checked,
                  )
                }
              />
              Falta energia 1 (esquerda) — UR {selectedUr}
            </label>

            <label style={{ ...checkboxLabelStyle, marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={selectedUrFalta2}
                onChange={(e) =>
                  onSetUrSemEnergia?.(
                    selectedUr,
                    UR_ENERGY_TYPE.FALTA_2,
                    e.target.checked,
                  )
                }
              />
              Falta energia 2 (direita) — UR {selectedUr}
            </label>

            <button
              type="button"
              style={secondaryBtnStyle}
              onClick={() => onClearUrSemEnergia?.()}
              disabled={totalSemEnergia === 0}
            >
              Ligar energia em todas
            </button>
          </>
        )}

        {tab === 'radio' && (
          <>
            <p style={hintStyle}>
              Linhas, textos e imagens começam apagados. Marque em cada grupo o que
              deve ficar visível — os três são independentes.
            </p>

            <div style={{ ...listStyle, maxHeight: 360 }}>
              <CheckboxGroup
                title="Linhas (radio-1 … radio-6)"
                options={radioLineOptions}
                selected={selectedLines}
                onToggle={(id) => toggleId(setSelectedLines, id)}
              />

              <CheckboxGroup
                title="Texto da torre"
                options={torreTextoOptions}
                selected={selectedTextos}
                onToggle={(id) => toggleId(setSelectedTextos, id)}
              />

              <CheckboxGroup
                title="Imagem da torre"
                options={torreImgOptions}
                selected={selectedImgs}
                onToggle={(id) => toggleId(setSelectedImgs, id)}
              />
            </div>

            <button
              type="button"
              style={simulateBtnStyle(!hasRadioSelection)}
              disabled={!hasRadioSelection}
              onClick={handleApplyVisibility}
            >
              Aplicar visibilidade
            </button>

            <button
              type="button"
              style={secondaryBtnStyle}
              onClick={handleResetRadios}
            >
              Apagar todos (voltar ao padrão)
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function FiberTestFab({
  setFibers,
  fiberIds,
  cableIdLabelsVisible,
  setCableIdLabelsVisible,
  setLeds,
  ledPairs,
  applyVisibility,
  radioLineOptions,
  torreTextoOptions,
  torreImgOptions,
  resetRadios,
  network,
  onSimulateFiberDrop,
  onClearFiberSimulation,
  onExportNetwork,
  onImportNetwork,
  getAfetadosPreview,
  onLoadExampleNetwork,
  semEnergiaPorUr,
  onSetUrSemEnergia,
  onClearUrSemEnergia,
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        style={fabStyle}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen(true)}
      >
        Teste
      </button>

      <TestModal
        open={open}
        onClose={() => setOpen(false)}
        setFibers={setFibers}
        fiberIds={fiberIds}
        cableIdLabelsVisible={cableIdLabelsVisible}
        setCableIdLabelsVisible={setCableIdLabelsVisible}
        setLeds={setLeds}
        ledPairs={ledPairs}
        applyVisibility={applyVisibility}
        radioLineOptions={radioLineOptions}
        torreTextoOptions={torreTextoOptions}
        torreImgOptions={torreImgOptions}
        resetRadios={resetRadios}
        network={network}
        onSimulateFiberDrop={onSimulateFiberDrop}
        onClearFiberSimulation={onClearFiberSimulation}
        onExportNetwork={onExportNetwork}
        onImportNetwork={onImportNetwork}
        getAfetadosPreview={getAfetadosPreview}
        onLoadExampleNetwork={onLoadExampleNetwork}
        semEnergiaPorUr={semEnergiaPorUr}
        onSetUrSemEnergia={onSetUrSemEnergia}
        onClearUrSemEnergia={onClearUrSemEnergia}
      />
    </>
  )
}
