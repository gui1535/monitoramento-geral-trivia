import { Navigate, Route, Routes } from 'react-router-dom'
import { GlobalStyles } from './components/GlobalStyles'
import { LoginPage } from './pages/LoginPage'
import { MonitoramentoPage } from './pages/MonitoramentoPage'

function App() {
  return (
    <>
      <GlobalStyles />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/monitoramento" element={<MonitoramentoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
