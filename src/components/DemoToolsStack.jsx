import { DemoTestPanel } from './DemoTestPanel'
import { ShowCableIdsFab } from './ShowCableIdsFab'

const stackStyle = (top = 16) => ({
  position: 'absolute',
  top,
  right: 16,
  zIndex: 31,
  width: 'min(280px, calc(100vw - 32px))',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  pointerEvents: 'auto',
})

export function DemoToolsStack({
  onApplyMessage,
  labelsVisible,
  onToggleCableIds,
  top = 16,
}) {
  return (
    <div
      style={stackStyle(top)} onPointerDown={(e) => e.stopPropagation()}>
      <DemoTestPanel onApplyMessage={onApplyMessage} />
      <ShowCableIdsFab
        fullWidth
        labelsVisible={labelsVisible}
        onToggle={onToggleCableIds}
      />
    </div>
  )
}
