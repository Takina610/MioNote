/**
 * 上传后的端到端校验：逐张从公共域名取一遍，和账本比对。
 *
 * 为什么值得写成一个脚本（而不是抽查几张）：上传"成功"（PUT 返回 2xx）和
 * "线上真的能拿到那张图"是两件事。中间可能出问题的地方不少——域名没生效、
 * 对象是私有的、中文文件名的编码在某一环被处理错、?v= 拼串出错。
 * 一次全量核对（1078 个 HEAD 请求，几秒钟）能把这些一次排除掉。
 *
 * 用 HEAD 而不是 GET：只比对存在性与 Content-Length，不下载 387 MB。
 *
 * 用法：bun run scripts/verify-upload.ts [--sample N]
 */
import { deploy, vault } from '../vault.config.ts'
import { collectNoteAssets, readManifest, readR2Env, publicUrl } from '../plugins/vault/deploy.ts'
import { VaultStore } from '../plugins/vault/store.ts'
import { humanBytes } from '../plugins/vault/utils.ts'

const argv = process.argv.slice(2)
const sampleAt = argv.indexOf('--sample')
const sampleSize = sampleAt === -1 ? 0 : Number(argv[sampleAt + 1]) || 0

const repoRoot = process.cwd()
const env = readR2Env(repoRoot, deploy)
const manifest = readManifest(repoRoot)

if (!env.publicBase) {
  console.error('\n  没配 R2_PUBLIC_BASE，没法核对。\n')
  process.exit(1)
}
if (!manifest) {
  console.error('\n  没有 assets.manifest.json，先跑一次 bun run publish。\n')
  process.exit(1)
}

const store = new VaultStore(vault)
let assets = collectNoteAssets(store, deploy)
if (sampleSize > 0) assets = assets.slice(0, sampleSize)

console.log('')
console.log('  MioNote · 上传后端到端校验')
console.log('  ──────────────────────────────────────────────')
console.log(`  公共域名  ${env.publicBase}`)
console.log(`  核对      ${assets.length} 个对象（HEAD，不下载内容）`)
console.log('')

interface Problem {
  key: string
  reason: string
}

const problems: Problem[] = []
let ok = 0
let bytes = 0
let cursor = 0

/** 一个 HEAD 请求。超时 20 秒，失败重试一次（家用网络偶发抖动不该算失败） */
async function head(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20_000)
      const response = await fetch(url, { method: 'HEAD', signal: controller.signal })
      clearTimeout(timer)
      return response
    } catch {
      if (attempt === 1) return null
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  return null
}

async function worker(): Promise<void> {
  for (;;) {
    const index = cursor
    cursor += 1
    const asset = assets[index]
    if (!asset) return

    const entry = manifest?.objects[asset.key]
    if (!entry) {
      problems.push({ key: asset.key, reason: '账本里没有这条记录' })
      continue
    }
    if (entry.at === 0) {
      problems.push({ key: asset.key, reason: '账本说只登记过、没上传' })
      continue
    }

    const url = publicUrl(env.publicBase, asset.key, entry.sha)
    const response = await head(url)
    if (!response) {
      problems.push({ key: asset.key, reason: '请求失败（超时或网络错误）' })
      continue
    }
    if (!response.ok) {
      problems.push({ key: asset.key, reason: `HTTP ${response.status}` })
      continue
    }

    const length = Number(response.headers.get('content-length') ?? '-1')
    if (length !== entry.size) {
      problems.push({
        key: asset.key,
        reason: `大小对不上：线上 ${length} 字节，本地 ${entry.size} 字节`,
      })
      continue
    }

    // 顺带确认缓存头是我们设的那套（配了 immutable 才能让 CDN 长期缓存）
    const cacheControl = response.headers.get('cache-control') ?? ''
    if (!cacheControl.includes('immutable')) {
      problems.push({ key: asset.key, reason: `缓存头不对：${cacheControl || '(空)'}` })
      continue
    }

    ok += 1
    bytes += entry.size
  }
}

const started = Date.now()
await Promise.all(Array.from({ length: Math.min(16, assets.length) }, () => worker()))
const seconds = ((Date.now() - started) / 1000).toFixed(1)

console.log(`  ✓ ${ok}/${assets.length} 个对象在公共域名上可读，字节数一致 · ${humanBytes(bytes)} · ${seconds}s`)

if (problems.length > 0) {
  console.log('')
  console.log(`  ✗ ${problems.length} 个有问题：`)
  for (const problem of problems.slice(0, 15)) {
    console.log(`      ${problem.key}`)
    console.log(`        ${problem.reason}`)
  }
  if (problems.length > 15) console.log(`      …还有 ${problems.length - 15} 个`)
}

console.log('')
console.log(problems.length === 0 ? '  全部通过。线上图片可以正常访问。' : '  有对象没通过，见上。')
console.log('')
process.exit(problems.length === 0 ? 0 : 1)
