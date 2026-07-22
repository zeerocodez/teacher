import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { UIProvider } from './contexts/UIContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <App />
          <Toaster position="bottom-right" />
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
