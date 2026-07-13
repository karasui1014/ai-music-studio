import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { STORAGE_KEYS } from './lib/storageKeys.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// offline support — register only in production so dev/HMR stays untouched
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // offline caching is an enhancement; the app works without it
    })
  })
}

// one-time console notice for anyone inspecting the code — not a technical
// protection (none is possible for a static client-side app), just an
// unmistakable statement of the terms.
if (!window.localStorage.getItem(STORAGE_KEYS.noticeShown)) {
  console.log(
    '%cAI Music Studio',
    'font-size: 20px; font-weight: bold; color: #5b4fe9;',
  )
  console.log(
    '%c第三者への無断譲渡・複製・再配布は禁止されています。',
    'font-size: 13px; color: #b91c1c; font-weight: bold;',
  )
  console.log('© karasui1014. All rights reserved.')
  window.localStorage.setItem(STORAGE_KEYS.noticeShown, '1')
}
