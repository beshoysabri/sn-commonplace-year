import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// The book's serif on devices without Iowan Old Style or Palatino (Android,
// Linux); browsers only download it where the stack reaches it.
import '@fontsource-variable/source-serif-4'
import '@fontsource-variable/source-serif-4/wght-italic.css'
import './styles.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
