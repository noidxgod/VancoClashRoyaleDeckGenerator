import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { FanDataProvider } from './data/FanDataContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <FanDataProvider>
        <App />
      </FanDataProvider>
    </BrowserRouter>
  </StrictMode>,
)
