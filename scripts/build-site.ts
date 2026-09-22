import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deploy, vault } from '../vault.config.ts'
import { buildStaticSite, printSiteReport } from '../plugins/vault/build.ts'
import { readR2Env } from '../plugins/vault/deploy.ts'

/**
 * 把 dist/ 补成一个能部署的静态站（在 `vite build` 之后跑）。
 *
 * 发布顺序（三条命令，少了哪条都会出问题）：
 *
 *   bun run sync      D: 上的文本 → content/            ← 不跑的话线上文本是旧的
 *   bun run publish   图片 → R2                          ← 不跑的话线上缺图
 *   bun run build     生成静态站（这一步会核对上面两件做完了没有）
 *
 * 这个脚本本身不碰网络：它只读 content/ 和上传账本，产出文件。
 * 所以它能在没有凭证的机器上跑（比如 CI）。
 *
 *   bun run build                      正常构建；有图没上传就报错
 *   bun run build --allow-missing-assets  有没上传的图也继续（首次试构建用）
 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(repoRoot, 'dist')
const argv = process.argv.slice(2)
const allowMissingAssets = argv.includes('--allow-missing-assets')

const env = readR2Env(repoRoot, deploy)
if (!env.publicBase) {
  console.error('')
  console.error('  缺少 R2 公共域名，图片会指向不存在的地址。')
  console.error('')
  console.error(`  在 ${env.envPath} 里加一行（或者直接跑 bun run publish 之后按提示配）：`)
  console.error('')
  console.error('    R2_PUBLIC_BASE=https://img.example.com')
  console.error('')
  console.error('  没挂自定义域名的话，可以用桶的 r2.dev 地址（试水够用，但有限流）。')
  console.error('')
  process.exit(1)
}

const report = buildStaticSite(vault, deploy, repoRoot, outDir, { publicBase: env.publicBase })
const fatal = printSiteReport(report, { allowMissingAssets })

if (fatal) process.exit(1)
