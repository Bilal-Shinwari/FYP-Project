import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Inject ngrok-skip-browser-warning on all requests to the ngrok backend
const _fetch = window.fetch
window.fetch = function (url, opts = {}) {
  const base = localStorage.getItem('api_base') || ''
  if (base && typeof url === 'string' && url.startsWith(base)) {
    opts = { ...opts, headers: { 'ngrok-skip-browser-warning': '1', ...opts.headers } }
  }
  return _fetch(url, opts)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
