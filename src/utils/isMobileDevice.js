export function isMobileDevice() {
  if (typeof window === 'undefined') return false

  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false
  const narrowViewport = window.matchMedia?.('(max-width: 768px)')?.matches ?? false
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

  return mobileUa || (narrowViewport && coarsePointer)
}
