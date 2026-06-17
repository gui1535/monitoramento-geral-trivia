export const TEST_MODE_STORAGE_KEY = 'teste:1'

export function isTestModeEnabled() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(TEST_MODE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
