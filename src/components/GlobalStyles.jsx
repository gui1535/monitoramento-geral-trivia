import { LED_NOT_OK_FILL, LED_NOT_OK_FILL_BRIGHT } from '../leds/leds'
import { RADIO_OK_COLOR } from '../radios/radios'
import { colors } from '../styles/tokens'

const radioOkRgb = '0, 255, 72'

const globalCss = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root {
    width: 100%;
    height: 100%;
    margin: 0;
    touch-action: manipulation;
    overscroll-behavior: none;
  }
  button { font: inherit; }

  @keyframes monitoramento-led-blink {
    0%, 100% { fill: var(--led-fill-base, ${LED_NOT_OK_FILL}); }
    50% { fill: var(--led-fill-bright, ${LED_NOT_OK_FILL_BRIGHT}); }
  }

  rect.led-blink {
    animation: monitoramento-led-blink 0.85s ease-in-out infinite;
    fill: var(--led-fill-base, ${LED_NOT_OK_FILL});
    opacity: 1;
    stroke-opacity: 1;
  }

  rect.led-stable {
    animation: none !important;
    fill-opacity: 1;
    opacity: 1;
    stroke-opacity: 1;
  }

  @keyframes monitoramento-fibra-piscar {
    0%, 100% { stroke-opacity: 1; }
    50% { stroke-opacity: 0.35; }
  }

  .fibra-caida {
    stroke: #e53935 !important;
    stroke-width: 4px !important;
    animation: monitoramento-fibra-piscar 1s ease-in-out infinite;
  }

  .equipamento-sem-comunicacao {
    opacity: 0.4 !important;
    filter: grayscale(1);
  }

  @keyframes monitoramento-radio-evidente {
    0%, 100% {
      filter: drop-shadow(0 0 3px rgba(${radioOkRgb}, 0.55));
    }
    50% {
      filter: drop-shadow(0 0 12px rgba(${radioOkRgb}, 0.95));
    }
  }

  .radio-evidente {
    opacity: 1 !important;
    animation: monitoramento-radio-evidente 1.2s ease-in-out infinite;
  }

  path.radio-evidente[id^="radio-"] {
    stroke: ${RADIO_OK_COLOR} !important;
  }

  path.radio-evidente[id^="texto-torre-"] {
    fill: #272F22 !important;
    animation: none !important;
    filter: none !important;
  }

  .antena-funcionando {
    filter: drop-shadow(0 0 8px rgba(${radioOkRgb}, 0.85))
      sepia(0.35) hue-rotate(55deg) saturate(2.8) brightness(1.05);
  }
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
