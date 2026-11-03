import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from './contexts/SessionContext'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
)
