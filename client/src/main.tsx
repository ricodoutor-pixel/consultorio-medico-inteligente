import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { googleTagManager } from './lib/google-tag-manager'

// ============================================================================
// INICIALIZAR GOOGLE TAG MANAGER
// ============================================================================

googleTagManager.initialize();

// ============================================================================
// RASTREAR CARREGAMENTO DA PÁGINA
// ============================================================================

googleTagManager.trackPageView('App Loaded', window.location.pathname);

// ============================================================================
// RENDERIZAR APP
// ============================================================================

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
