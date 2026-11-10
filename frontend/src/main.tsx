import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './index.css'
import App from './App'
import { AuthProvider } from './contexts/AuthProvider'
import { FarmProvider } from './contexts/FarmProvider'
import { SessionProvider } from './contexts/SessionContext'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SessionProvider>
            <FarmProvider>
              <App />
              <Toaster richColors position="top-right" />
            </FarmProvider>
          </SessionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
