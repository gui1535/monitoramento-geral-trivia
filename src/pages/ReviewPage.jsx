import { CanvasViewport } from '../canvas/CanvasViewport'
import { CanvasWorld } from '../canvas/CanvasWorld'
import { ReviewHeader } from '../components/ReviewHeader'
import { INTERACTION_MODE } from '../canvas/constants'

const pageStyle = {
  width: '100%',
  height: '100%',
  minHeight: '100svh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const bodyStyle = {
  flex: 1,
  minHeight: 0,
  position: 'relative',
}

export function ReviewPage({ review, onExit, onSvgReady }) {
  return (
    <main style={pageStyle}>
      <ReviewHeader
        frameCount={review.frameCount}
        currentIndex={review.currentIndex}
        currentFrame={review.currentFrame}
        isPlaying={review.isPlaying}
        playbackSpeed={review.playbackSpeed}
        canStepBack={review.canStepBack}
        canStepForward={review.canStepForward}
        canPlay={review.canPlay}
        onTogglePlay={review.togglePlay}
        onStepBack={review.stepBackward}
        onStepForward={review.stepForward}
        onGoToFrame={review.goToFrame}
        onCycleSpeed={review.cycleSpeed}
        onExit={onExit}
      />

      <div style={bodyStyle}>
        <CanvasViewport mode={INTERACTION_MODE.NAVIGATION}>
          <CanvasWorld
            onSvgReady={onSvgReady}
            interactionMode={INTERACTION_MODE.NAVIGATION}
          />
        </CanvasViewport>
      </div>
    </main>
  )
}
