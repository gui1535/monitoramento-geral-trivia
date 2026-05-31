/** Caminho público com prefixo do Vite (`base`), ex.: `/monitoramento/`. */
export function withBaseUrl(path = '') {
  const base = import.meta.env.BASE_URL
  const normalized = String(path).replace(/^\//, '')
  return `${base}${normalized}`
}
