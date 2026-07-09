import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Injected only into the production build — the dev server (HMR, esbuild eval)
// needs a looser policy, so we don't want this meta tag while `vite dev` is running.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // Radix UI positions popovers/menus via inline style attributes, so style-src
  // needs 'unsafe-inline'; everything else stays locked to same-origin.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ')

function injectSecurityHeaders(): Plugin {
  return {
    name: 'inject-security-headers',
    transformIndexHtml(html, ctx) {
      if (ctx.server) return html // dev server — leave untouched
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}">\n    <meta name="referrer" content="no-referrer">`,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // relative paths so the built site works at any URL (GitHub Pages subpath included)
  base: './',
  plugins: [react(), injectSecurityHeaders()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
