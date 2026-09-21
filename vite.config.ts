import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { vaultPlugin } from './plugins/vault/index.ts'
import { vault } from './vault.config.ts'

export default defineConfig({
  plugins: [vaultPlugin(vault), react()],
  server: {
    port: 5178,
  },
})
