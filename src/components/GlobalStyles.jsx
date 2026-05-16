import { colors } from '../styles/tokens'

const globalCss = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { width: 100%; height: 100%; margin: 0; }
  button { font: inherit; }
`

export function GlobalStyles() {
  return (
    <style>
      {globalCss}
      {`body {
        font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        line-height: 1.4;
        color: ${colors.text};
        background: ${colors.bg};
        overflow: hidden;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }`}
    </style>
  )
}
