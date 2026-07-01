const SECOND_MS = 1000

export function buildReviewTimeline(frames = []) {
  if (frames.length === 0) {
    return { start: 0, end: 0, duration: 0, useSynthetic: false }
  }

  const start = frames[0].timestamp
  const realEnd = frames[frames.length - 1].timestamp
  const realDuration = Math.max(0, realEnd - start)
  const minDuration = Math.max(0, (frames.length - 1) * SECOND_MS)
  const duration = Math.max(realDuration, minDuration)

  return {
    start,
    end: start + duration,
    duration,
    useSynthetic: realDuration < minDuration,
  }
}

export function findFrameIndexAtTime(frames, timeMs, timeline = null) {
  if (!frames.length) return 0

  const bounds = timeline ?? buildReviewTimeline(frames)

  if (bounds.useSynthetic) {
    const offset = timeMs - bounds.start
    return Math.min(
      frames.length - 1,
      Math.max(0, Math.floor(offset / SECOND_MS)),
    )
  }

  let index = 0
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].timestamp <= timeMs) {
      index = i
    } else {
      break
    }
  }

  return index
}

export function clampTimelineTime(timeMs, timeline) {
  if (!timeline.duration) {
    return timeline.start
  }
  return Math.max(timeline.start, Math.min(timeMs, timeline.end))
}

export function formatReviewElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / SECOND_MS))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function resolveSnapshotTimestamp(errors = [], fallback = Date.now()) {
  const latest = errors[errors.length - 1]
  return latest?.createdAt ?? fallback
}

export const REVIEW_TICK_MS = SECOND_MS
