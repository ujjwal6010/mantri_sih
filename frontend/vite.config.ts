import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Separate large vendor libs from app code
          groups: [
            {
              name: 'd3-vendor',
              test: /[\\/]node_modules[\\/]d3/,
              priority: 20,
            },
            {
              name: 'plotly-vendor',
              test: /[\\/]node_modules[\\/]plotly/,
              priority: 20,
            },
            {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
