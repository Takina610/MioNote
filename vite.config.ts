import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { vaultPlugin } from './plugins/vault/index.ts'
import { vault } from './vault.config.ts'

export default defineConfig({
  plugins: [vaultPlugin(vault), react()],
  server: {
    port: 5178,
  },
  define: {
    // 「看源码」的截断阈值。「可读」标记是构建时按这个值算的，两端必须一致，
    // 所以从 vault.config.ts 注入成构建期常量，不搞第二份配置。
    __MAX_CODE_BYTES__: JSON.stringify(vault.maxCodeBytes),
  },
})
