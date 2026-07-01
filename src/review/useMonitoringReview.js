import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyMonitoringSnapshot,
  captureMonitoringSnapshot,
  snapshotToReactState,
} from './monitoringSnapshot'

const DEFAULT_PLAYBACK_MS = 1200
const SPEEDS = [0.5, 1, 1.5, 2]

export function useMonitoringReview({
  getSvg,
  fiberIds,
  getCaptureContext,
  restoreRefs,
  onRestoreReactState,
}) {
  const framesRef = useRef([])
  const [frameCount, setFrameCount] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isReviewActive, setIsReviewActive] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speedIndex, setSpeedIndex] = useState(1)
  const liveSnapshotRef = useRef(null)
  const pendingLiveRestoreRef = useRef(null)
  const playTimerRef = useRef(null)
  const lastFingerprintRef = useRef('')

  const getFrames = useCallback(() => framesRef.current, [])

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

      if (updateIndex) {
        setCurrentIndex(safeIndex)
      }
    },
    [fiberIds, getSvg, onRestoreReactState, restoreRefs],
  )

  const recordFrame = useCallback(
    (label = '') => {
      if (isReviewActive) return

      const svg = getSvg()
      const context = getCaptureContext?.()
      if (!svg || !context) return

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
        errors: context.errors,
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
      setFrameCount(framesRef.current.length)
      setCurrentIndex(framesRef.current.length - 1)
    },
    [fiberIds, getCaptureContext, getSvg, isReviewActive],
  )

  const enterReview = useCallback(() => {
    const svg = getSvg()
    const context = getCaptureContext?.()
    if (!svg || !context) return false

    if (framesRef.current.length === 0) {
      recordFrame('Estado inicial')
    }

    if (framesRef.current.length === 0) return false

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

    setIsReviewActive(true)
    setIsPlaying(false)
    setCurrentIndex(framesRef.current.length - 1)
    return true
  }, [fiberIds, getCaptureContext, getSvg, recordFrame])

  const syncReviewFrame = useCallback(() => {
    if (framesRef.current.length === 0) return
    applyFrame(currentIndex, { visualOnly: true, updateIndex: false })
  }, [applyFrame, currentIndex])

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
    setIsReviewActive(false)
  }, [])

  const goToFrame = useCallback(
    (index) => {
      if (!isReviewActive) return
      setIsPlaying(false)
      applyFrame(index, { visualOnly: true })
    },
    [applyFrame, isReviewActive],
  )

  const stepForward = useCallback(() => {
    goToFrame(currentIndex + 1)
  }, [currentIndex, goToFrame])

  const stepBackward = useCallback(() => {
    goToFrame(currentIndex - 1)
  }, [currentIndex, goToFrame])

  const togglePlay = useCallback(() => {
    if (!isReviewActive) return
    setIsPlaying((playing) => !playing)
  }, [isReviewActive])

  const seekToProgress = useCallback(
    (progress) => {
      if (!isReviewActive || framesRef.current.length === 0) return
      const index = Math.round(progress * (framesRef.current.length - 1))
      goToFrame(index)
    },
    [goToFrame, isReviewActive],
  )

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((index) => (index + 1) % SPEEDS.length)
  }, [])

  const clearRecording = useCallback(() => {
    if (isReviewActive) exitReview()
    framesRef.current = []
    lastFingerprintRef.current = ''
    setFrameCount(0)
    setCurrentIndex(0)
  }, [exitReview, isReviewActive])

  useEffect(() => {
    if (!isPlaying || !isReviewActive) {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
      return undefined
    }

    const intervalMs = DEFAULT_PLAYBACK_MS / SPEEDS[speedIndex]

    playTimerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1
        if (next >= framesRef.current.length) {
          setIsPlaying(false)
          return prev
        }
        applyFrame(next, { updateIndex: false, visualOnly: true })
        return next
      })
    }, intervalMs)

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
    }
  }, [applyFrame, isPlaying, isReviewActive, speedIndex])

  const currentFrame = framesRef.current[currentIndex] ?? null
  const reviewErrors = currentFrame?.errors ?? []

  return {
    frameCount,
    currentIndex,
    currentFrame,
    reviewErrors,
    isReviewActive,
    isPlaying,
    playbackSpeed: SPEEDS[speedIndex],
    canStepBack: currentIndex > 0,
    canStepForward: currentIndex < frameCount - 1,
    canPlay: frameCount > 1,
    recordFrame,
    enterReview,
    exitReview,
    goToFrame,
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
