import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../styles/tokens'
import { withBaseUrl } from '../utils/baseUrl'

const pageStyle = {
  width: '100%',
  height: '100%',
  minHeight: '100svh',
  display: 'grid',
  placeItems: 'center',
  background: colors.bg,
  color: colors.text,
}

const cardStyle = {
  width: 'min(360px, calc(100% - 32px))',
  padding: 28,
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  textAlign: 'center',
  boxShadow: '0 4px 16px rgba(18, 20, 26, 0.06)',
}

const logoStyle = {
  height: 50,
  width: 'auto',
  display: 'block',
  margin: '0 auto 24px',
}

const buttonBaseStyle = {
  width: '100%',
  padding: '10px 16px',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 500,
  color: colors.triviaWhite,
  cursor: 'pointer',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [buttonHovered, setButtonHovered] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    navigate('/monitoramento')
  }

  return (
    <main style={pageStyle}>
      <form style={cardStyle} onSubmit={handleSubmit}>
        <img src={withBaseUrl('logotipo-azul.png')} alt="Trivia" style={logoStyle} />
        <button
          type="submit"
          style={{
            ...buttonBaseStyle,
            background: buttonHovered ? '#010080' : colors.triviaBlue,
          }}
          onMouseEnter={() => setButtonHovered(true)}
          onMouseLeave={() => setButtonHovered(false)}
        >
          Entrar
        </button>
      </form>
    </main>
  )
}
