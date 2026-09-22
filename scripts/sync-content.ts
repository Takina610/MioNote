import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deploy, vault } from '../vault.config.ts'
import { applyContent, planContent } from '../plugins/vault/deploy.ts'
import { humanBytes } from '../plugins/vault/utils.ts'

/**
 * 把硬盘上的文本镜像进 `content/`——发布快照。
 *
 * 为什么要有这一步：线上站点必须能在**没有 D: 盘**的地方构建（CI、换台电脑），
 * 所以文本（md / html / js / css / vue）得进仓库；而图片不进仓库（732 MB 放不进任何 git 仓库），
 * 它们走 R2，由 scripts/publish.ts 上传。
 *
 * 这个脚本只做一件事：让 content/ 等于「现在的硬盘」。所以它也会**删掉**源文件夹里已经没有的文件。
 * 它从不写回源文件夹——MioNote 是只读系统，这条边界不会因为发布流程而破。
 *
 *   bun run sync            实际同步
 *   bun run sync --dry-run  只看差多少，不写任何东西
 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dryRun = process.argv.includes('--dry-run')

const plan = planContent(vault, deploy, repoRoot)
const published = vault.sections.filter((s) => s.publish !== 'never')

const missing = plan.pending.filter((p) => p.reason === 'missing').length
const stale = plan.pending.length - missing

const line = (label: string, value: string) => console.log(`  ${label.padEnd(8)}${value}`)

console.log('')
console.log(`  MioNote · 内容快照同步${dryRun ? '（dry-run，不会写任何文件）' : ''}`)
console.log('  ──────────────────────────────────────────────')
line('目标', `${deploy.contentDir}/（提交进 git 的那一份）`)
line('来源', `${published.map((s) => s.name).join(' · ')}`)
if (vault.sections.length > published.length) {
  line('已跳过', `${vault.sections.filter((s) => s.publish === 'never').map((s) => s.name).join(' · ')}（永不发布）`)
}
line('期望', `${plan.files.length} 个文件 / ${humanBytes(plan.expectedBytes)}`)
line('快照现况', `${plan.presentKeys.size} 个文件`)
line('待写入', `${plan.pending.length} 个（缺 ${missing} / 过期 ${stale}）`)
line('待删除', `${plan.extra.length} 个`)

const preview = (items: string[], limit = 5) => {
  for (const item of items.slice(0, limit)) console.log(`            ${item}`)
  if (items.length > limit) console.log(`            …还有 ${items.length - limit} 个`)
}

if (plan.pending.length > 0) {
  console.log('')
  console.log('  即将写入：')
  preview(plan.pending.map((p) => `${p.reason === 'missing' ? '新增' : '更新'} ${p.section}/${p.rel}`))
}
if (plan.extra.length > 0) {
  console.log('')
  console.log('  即将删除（源文件夹里已经没有它们了）：')
  preview(plan.extra)
}

if (dryRun) {
  console.log('')
  console.log('  dry-run 结束。实际同步请跑：bun run sync')
  console.log('')
  process.exit(0)
}

if (plan.pending.length === 0 && plan.extra.length === 0) {
  console.log('')
  console.log('  已经是最新，什么都没动。')
  console.log('')
  process.exit(0)
}

const result = applyContent(plan)
const after = plan.presentKeys.size - result.deleted + result.written

console.log('')
console.log(`  写入 ${result.written} 个（${humanBytes(result.bytes)}）· 删除 ${result.deleted} 个`)
console.log(`  现在 ${deploy.contentDir}/ 里有 ${after} 个文件`)
console.log('')
