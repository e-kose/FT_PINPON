import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    // Development server için CSP bypass
    headers: {
    //   'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
		'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline';"
}
  },
  build: {
    // Production build için CSP uyumlu çıktı
    rollupOptions: {
      output: {
        // Eval kullanımını minimize et
        format: 'es'
      }
    }
  }
})