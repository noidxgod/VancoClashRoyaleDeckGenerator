import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ShowcasePage } from './pages/ShowcasePage'

const App = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path="/" element={<Navigate to="/showcase" replace />} />
      <Route path="/showcase" element={<ShowcasePage />} />
      <Route path="/analytics" element={<Navigate to="/showcase" replace />} />
      <Route path="*" element={<Navigate to="/showcase" replace />} />
    </Route>
  </Routes>
)

export default App
