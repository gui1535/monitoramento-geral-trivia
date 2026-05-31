/** Ative no console: localStorage.setItem('teste:1', '1') */
export function isTestModeEnabled() {
  try {
    return localStorage.getItem('teste:1') === '1'
  } catch {
    return false
  }
}
