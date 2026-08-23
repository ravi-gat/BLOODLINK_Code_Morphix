import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function raviAssetResolver() {
  return {
    name: 'ravi-asset-resolver',
    resolveId(id) {
      if (id.startsWith('ravi:asset/')) {
        const filename = id.replace('ravi:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    raviAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        // Split vendor and feature chunks to reduce initial bundle load time
        manualChunks: {
          // Core React runtime
          'vendor-react': ['react', 'react-dom'],
          // Routing
          'vendor-router': ['react-router'],
          // Charts (recharts is large — isolate it)
          'vendor-charts': ['recharts'],
          // Radix UI primitives
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          // State management
          'vendor-state': ['zustand'],
        },
      },
    },
    // Raise warning threshold slightly — large healthcare dashboards are expected
    chunkSizeWarningLimit: 600,
  },
})
