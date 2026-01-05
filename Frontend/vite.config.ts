import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    host: '0.0.0.0', 
    port: 5173,
    strictPort: true,
    // Nginx üzerinden HMR (Hot Module Replacement) çalışması
    hmr: {
      protocol: 'wss',  
      host: 'localhost',
      clientPort: 443,
    },
    headers: {
      'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline';"
    }
  },
  build: {
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  }
})