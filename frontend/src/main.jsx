import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CatalogueProvider } from './store/CatalogueContext.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CatalogueProvider>
        <App />
      </CatalogueProvider>
    </AuthProvider>
  </StrictMode>,
)