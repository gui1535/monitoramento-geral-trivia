import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyMonitoringSnapshot,
  captureMonitoringSnapshot,
  snapshotToReactState,
} from './monitoringSnapshot'
import {
  buildReviewTimeline,
  clampTimelineTime,
  findFrameIndexAtTime,
  REVIEW_TICK_MS,
} from './reviewTimeline'

const SPEEDS = [0.5, 1, 1.5, 2, 4]

export function useMonitoringReview({
  getSvg,
  fiberIds,
  getCaptureContext,
  restoreRefs,
  onRestoreReactState,
}) {
  const framesRef = useRef([])
  const timelineRef = useRef(buildReviewTimeline([]))
  const [frameCount, setFrameCount] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isReviewActive, setIsReviewActive] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speedIndex, setSpeedIndex] = useState(1)
  const liveSnapshotRef = useRef(null)
  const pendingLiveRestoreRef = useRef(null)
  const playTimerRef = useRef(null)
  const lastFingerprintRef = useRef('')
  const lastAppliedIndexRef = useRef(-1)

  const getFrames = useCallback(() => framesRef.current, [])

  const refreshTimeline = useCallback(() => {
    timelineRef.current = buildReviewTimeline(framesRef.current)
    return timelineRef.current
  }, [])

  const applyFrame = useCallback(
    (index, { updateIndex = true, visualOnly = false } = {}) => {
      const frames = framesRef.current
      if (frames.length === 0) return

      const safeIndex = Math.max(0, Math.min(index, frames.length - 1))
      const snapshot = frames[safeIndex]
      const svg = getSvg()

      if (svg) {
        applyMonitoringSnapshot(svg, snapshot, {
          fiberIds,
          restoreRefs: visualOnly ? undefined : restoreRefs,
        })

        if (!visualOnly) {
          onRestoreReactState?.(snapshotToReactState(snapshot))
        }
      }

      lastAppliedIndexRef.current = safeIndex

      if (updateIndex) {
        setCurrentIndex(safeIndex)
      }
    },
    [fiberIds, getSvg, onRestoreReactState, restoreRefs],
  )

  const seekToTime = useCallback(
    (timeMs, { keepPlaying = false } = {}) => {
      if (framesRef.current.length === 0) return

      const timeline = refreshTimeline()
      const clamped = clampTimelineTime(timeMs, timeline)
      const index = findFrameIndexAtTime(framesRef.current, clamped, timeline)

      setCurrentTime(clamped)

      if (index !== lastAppliedIndexRef.current) {
        applyFrame(index, { visualOnly: true })
      } else {
        setCurrentIndex(index)
      }

      if (!keepPlaying) {
        setIsPlaying(false)
      }
    },
    [applyFrame, refreshTimeline],
  )

  const recordFrame = useCallback(
    (label = '') => {
      if (isReviewActive) return

      const svg = getSvg()
      const context = getCaptureContext?.()
      if (!svg || !context) return

      const errors = context.errors ?? []

      const snapshot = captureMonitoringSnapshot({
        svg,
        fiberIds,
        label: label || context.label || 'Alteração no sistema',
        semEnergiaPorUr: context.semEnergiaPorUr,
        fallenFromFiber: context.fallenFromFiber,
        activeUrs: context.activeUrs,
        uprightChaves: context.uprightChaves,
        radioState: context.radioState,
        radioAlert: context.radioAlert,
        activeFailure: context.activeFailure,
        fixedFailureCabos: context.fixedFailureCabos,
        errors,
        timestamp: errors[errors.length - 1]?.createdAt,
      })

      if (!snapshot) return

      const fingerprint = JSON.stringify({
        fibers: snapshot.fibers,
        ur: snapshot.ur,
        radio: snapshot.radio,
        react: snapshot.react,
        errorsLen: snapshot.errors.length,
      })

      if (fingerprint === lastFingerprintRef.current && framesRef.current.length > 0) {
        return
      }

      lastFingerprintRef.current = fingerprint
      framesRef.current = [...framesRef.current, snapshot]
      refreshTimeline()
      setFrameCount(framesRef.current.length)
      setCurrentIndex(framesRef.current.length - 1)
      setCurrentTime(snapshot.timestamp)
    },
    [fiberIds, getCaptureContext, getSvg, isReviewActive, refreshTimeline],
  )

  const enterReview = useCallback(() => {
    const svg = getSvg()
    const context = getCaptureContext?.()
    if (!svg || !context) return false

    if (framesRef.current.length === 0) {
      recordFrame('Estado inicial')
    }

    if (framesRef.current.length === 0) return false

    const timeline = refreshTimeline()

    liveSnapshotRef.current = captureMonitoringSnapshot({
      svg,
      fiberIds,
      label: 'Estado ao vivo',
      semEnergiaPorUr: context.semEnergiaPorUr,
      fallenFromFiber: context.fallenFromFiber,
      activeUrs: context.activeUrs,
      uprightChaves: context.uprightChaves,
      radioState: context.radioState,
      radioAlert: context.radioAlert,
      activeFailure: context.activeFailure,
      fixedFailureCabos: context.fixedFailureCabos,
      errors: context.errors,
    })

    lastAppliedIndexRef.current = -1
    setIsReviewActive(true)
    setIsPlaying(false)
    setCurrentTime(timeline.start)
    setCurrentIndex(0)
    return true
  }, [fiberIds, getCaptureContext, getSvg, recordFrame, refreshTimeline])

  const syncReviewFrame = useCallback(() => {
    if (framesRef.current.length === 0) return
    seekToTime(currentTime)
  }, [currentTime, seekToTime])

  const syncLiveRestore = useCallback(() => {
    const live = pendingLiveRestoreRef.current
    if (!live) return

    const svg = getSvg()
    if (!svg) return

    applyMonitoringSnapshot(svg, live, { fiberIds, restoreRefs })
    onRestoreReactState?.(snapshotToReactState(live))
    pendingLiveRestoreRef.current = null
  }, [fiberIds, getSvg, onRestoreReactState, restoreRefs])

  const exitReview = useCallback(() => {
    setIsPlaying(false)

    if (playTimerRef.current) {
      clearInterval(playTimerRef.current)
      playTimerRef.current = null
    }

    const live = liveSnapshotRef.current
    if (live) {
      pendingLiveRestoreRef.current = live
    }

    liveSnapshotRef.current = null
    lastAppliedIndexRef.current = -1
    setIsReviewActive(false)
  }, [])

  const goToFrame = useCallback(
    (index) => {
      if (!isReviewActive) return

      const frame = framesRef.current[index]
      if (!frame) return

      seekToTime(frame.timestamp)
    },
    [isReviewActive, seekToTime],
  )

  const stepForward = useCallback(() => {
    const timeline = refreshTimeline()
    const next = clampTimelineTime(currentTime + REVIEW_TICK_MS, timeline)

    if (next > currentTime) {
      seekToTime(next)
      return
    }

    const nextFrame = framesRef.current[currentIndex + 1]
    if (nextFrame) {
      seekToTime(nextFrame.timestamp)
    }
  }, [currentIndex, currentTime, refreshTimeline, seekToTime])

  const stepBackward = useCallback(() => {
    const timeline = refreshTimeline()
    const next = clampTimelineTime(currentTime - REVIEW_TICK_MS, timeline)

    if (next < currentTime) {
      seekToTime(next)
      return
    }

    const prevFrame = framesRef.current[currentIndex - 1]
    if (prevFrame) {
      seekToTime(prevFrame.timestamp)
    }
  }, [currentIndex, currentTime, refreshTimeline, seekToTime])

  const togglePlay = useCallback(() => {
    if (!isReviewActive) return
    const timeline = refreshTimeline()
    if (!timeline.duration && frameCount <= 1) return
    if (!isPlaying && currentTime >= timeline.end) {
      seekToTime(timeline.start)
    }
    setIsPlaying((playing) => !playing)
  }, [
    currentTime,
    frameCount,
    isPlaying,
    isReviewActive,
    refreshTimeline,
    seekToTime,
  ])

  const seekToProgress = useCallback(
    (progress) => {
      if (!isReviewActive) return
      const timeline = refreshTimeline()
      if (!timeline.duration) return
      const timeMs = timeline.start + progress * timeline.duration
      seekToTime(timeMs)
    },
    [isReviewActive, refreshTimeline, seekToTime],
  )

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((index) => (index + 1) % SPEEDS.length)
  }, [])

  const clearRecording = useCallback(() => {
    if (isReviewActive) exitReview()
    framesRef.current = []
    timelineRef.current = buildReviewTimeline([])
    lastFingerprintRef.current = ''
    lastAppliedIndexRef.current = -1
    setFrameCount(0)
    setCurrentIndex(0)
    setCurrentTime(0)
  }, [exitReview, isReviewActive])

  useEffect(() => {
    if (!isPlaying || !isReviewActive) {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
      return undefined
    }

    const intervalMs = REVIEW_TICK_MS / SPEEDS[speedIndex]

    playTimerRef.current = window.setInterval(() => {
      const timeline = refreshTimeline()
      setCurrentTime((prev) => {
        const next = prev + REVIEW_TICK_MS
        if (next > timeline.end) {
          setIsPlaying(false)
          const index = findFrameIndexAtTime(
            framesRef.current,
            timeline.end,
            timeline,
          )
          if (index !== lastAppliedIndexRef.current) {
            applyFrame(index, { visualOnly: true })
          } else {
            setCurrentIndex(index)
          }
          return timeline.end
        }

        const index = findFrameIndexAtTime(framesRef.current, next, timeline)
        if (index !== lastAppliedIndexRef.current) {
          applyFrame(index, { visualOnly: true })
        } else {
          setCurrentIndex(index)
        }

        return next
      })
    }, intervalMs)

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
    }
  }, [applyFrame, isPlaying, isReviewActive, refreshTimeline, speedIndex])

  const timeline = useMemo(
    () => buildReviewTimeline(framesRef.current),
    [frameCount, currentTime],
  )

  const currentFrame = framesRef.current[currentIndex] ?? null

  return {
    frameCount,
    currentIndex,
    currentFrame,
    currentTime,
    timelineStart: timeline.start,
    timelineEnd: timeline.end,
    timelineDuration: timeline.duration,
    timelineProgress:
      timeline.duration > 0
        ? (currentTime - timeline.start) / timeline.duration
        : 0,
    isReviewActive,
    isPlaying,
    playbackSpeed: SPEEDS[speedIndex],
    canStepBack: currentTime > timeline.start,
    canStepForward: currentTime < timeline.end,
    canPlay: timeline.duration > 0 || frameCount > 1,
    recordFrame,
    enterReview,
    exitReview,
    goToFrame,
    seekToTime,
    stepForward,
    stepBackward,
    togglePlay,
    seekToProgress,
    cycleSpeed,
    clearRecording,
    getFrames,
    syncReviewFrame,
    syncLiveRestore,
  }
}
