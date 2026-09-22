import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AwsClient } from 'aws4fetch'
import { deploy, vault } from '../vault.config.ts'
import {
  assetKey,
  bucketLabel,
  collectNoteAssets,
  hashFile,
  isUploaded,
  MANIFEST_PATH,
  planContent,
  publicUrl,
  readManifest,
  readR2Env,
  writeManifest,
  type AssetEntry,
  type Manifest,
  type R2Credentials,
} from '../plugins/vault/deploy.ts'
import { VaultStore } from '../plugins/vault/store.ts'
import { contentType, encodePath, humanBytes } from '../plugins/vault/utils.ts'

/**
 * 把笔记正文引用的图片上传到 R2。
 *
 * 这个脚本**只在你本机跑**，凭证在 `.env.local`（不在仓库里）。构建产物里没有它，
 * 浏览器里也没有任何能写 R2 的路径——线上是只读的，上传能力只存在于这一条命令上。
 *
 *   bun run publish:dry                 看要传什么，不碰网络
 *   bun run publish                     增量上传（没变的图不会重传）
 *   bun run publish --only soft-exam    只传一个文件夹
 *   bun run publish --prune             顺便删掉 R2 上已不在上传集合里的对象
 *
 * 上传集合由 plugins/vault/deploy.ts 的 collectNoteAssets 算出来：它就是笔记正文
 * 解析出来的图片引用表，和渲染用的是同一份数据。所以线上不会缺图，也不会多传没人看的图。
 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const argv = process.argv.slice(2)
const has = (flag: string) => argv.includes(flag)
const valueOf = (flag: string): string | undefined => {
  const at = argv.indexOf(flag)
  return at === -1 ? undefined : argv[at + 1]
}

const dryRun = has('--dry-run')
const registryOnly = has('--registry')
const prune = has('--prune')
const only = valueOf('--only')
const concurrency = Math.max(1, Math.min(Number(valueOf('--concurrency') ?? 8) || 8, 32))

if (has('--help') || has('-h')) {
  console.log(`
  bun run publish [选项]

    --dry-run            只列出要传什么，不发任何请求，也不动账本
    --registry           只登记账户（算出每张图的哈希、写进 assets.manifest.json），不上传。
                         用来在真正上传之前先把静态站建出来看效果
    --only <section>     只处理一个文件夹（soft-exam / interview / web-frontend / japanese / csharp）
    --prune              删掉 R2 上已经不在上传集合里的对象
    --concurrency <n>    并发数，默认 8
`)
  process.exit(0)
}

const env = readR2Env(repoRoot, deploy)

// publish 是本项目里唯一既有磁盘访问、又知道上传集合的地方，
// 所以"哪些引用本来就是坏的"由它记进账本（构建没有磁盘，分不出来）
const brokenKeys = new Set<string>()
const store = new VaultStore(vault, {
  onMissingAsset: (asset) => brokenKeys.add(assetKey(deploy.r2.prefix, asset.sectionId, asset.rel)),
})

let assets = collectNoteAssets(store, deploy)
if (only) {
  const known = new Set(vault.sections.map((s) => s.id))
  if (!known.has(only)) {
    console.error(`  没有这个文件夹：${only}（可选：${[...known].join(' / ')}）`)
    process.exit(1)
  }
  assets = assets.filter((asset) => asset.section === only)
}

const manifest: Manifest = readManifest(repoRoot) ?? {
  version: 1,
  bucket: env.bucket,
  prefix: deploy.r2.prefix,
  publicBase: env.publicBase,
  updatedAt: 0,
  objects: {},
  orphans: {},
  broken: [],
}

/** 账目是不是已经传上去了（publicBase 换了的话 URL 就变了，得按"没传"处理重新传） */
function alreadyOnR2(key: string, sha: string): boolean {
  const entry = manifest.objects[key]
  if (!isUploaded(entry) || entry.sha !== sha) return false
  // 域名换了 => 对外 URL 变了 => 必须重传一次，否则线上新域名下取不到（或者拿到旧的缓存）
  return !manifest.publicBase || manifest.publicBase === env.publicBase
}

// 每张都算 sha256：增量判断宁可慢一秒，也不要因为 mtime 猜错而漏传一张图
type UploadRow = { asset: AssetEntry; sha: string }
const rows: UploadRow[] = assets.map((asset) => ({ asset, sha: hashFile(asset.abs) }))
const changed = rows.filter((row) => !alreadyOnR2(row.asset.key, row.sha))
const unchanged = rows.filter((row) => !changed.includes(row))

const currentKeys = new Set(assets.map((asset) => asset.key))
const goneKeys = only
  ? []
  : Object.keys(manifest.objects).filter((key) => !currentKeys.has(key))

const changedBytes = changed.reduce((sum, row) => sum + row.asset.bytes, 0)
const totalBytes = rows.reduce((sum, row) => sum + row.asset.bytes, 0)

/* ------------------------------------------------------------------ 报告 */

const bySection = new Map<string, { name: string; files: number; bytes: number; pending: number }>()
for (const section of vault.sections) {
  bySection.set(section.id, { name: section.name, files: 0, bytes: 0, pending: 0 })
}
for (const row of rows) {
  const bucket = bySection.get(row.asset.section)
  if (!bucket) continue
  bucket.files += 1
  bucket.bytes += row.asset.bytes
}
for (const row of changed) {
  const bucket = bySection.get(row.asset.section)
  if (bucket) bucket.pending += 1
}

const line = (label: string, value: string) => console.log(`  ${label.padEnd(10)}${value}`)

const mode = dryRun ? '（dry-run，不发请求、不动账本）' : registryOnly ? '（只登记账本，不上传）' : ''

console.log('')
console.log(`  MioNote · 图片上传到 R2${mode}`)
console.log('  ──────────────────────────────────────────────')
line('桶', bucketLabel(env.bucket, deploy.r2.prefix))
line('公共域名', env.publicBase || '（还没配：R2_PUBLIC_BASE 为空，站点拼不出图片 URL）')
line('上传集合', `${assets.length} 个 / ${humanBytes(totalBytes)}（笔记正文引用到的图）`)
if (only) line('范围', `只处理 ${only}`)
console.log('')
for (const bucket of bySection.values()) {
  if (bucket.files === 0) continue
  const pending = bucket.pending > 0 ? `待传 ${bucket.pending}` : '已是最新'
  console.log(
    `    ${bucket.name.padEnd(10)} ${String(bucket.files).padStart(4)} 个 · ${humanBytes(bucket.bytes).padStart(8)}   ${pending}`,
  )
}
console.log('')
line('本次要传', changed.length === 0 ? '没有变化，无需上传' : `${changed.length} 个 / ${humanBytes(changedBytes)}`)
if (unchanged.length > 0) line('跳过', `${unchanged.length} 个（内容没变，已经在 R2 上）`)
if (goneKeys.length > 0) {
  line(
    '已不在集合',
    `${goneKeys.length} 个${prune ? '（--prune：会从 R2 删掉）' : '（仍留在 R2 上，加 --prune 可清理）'}`,
  )
}

// content/ 落后的话，线上文本会是旧的——这正是"漂移"最容易咬人的地方，所以每次都说
const contentPlan = planContent(vault, deploy, repoRoot)
if (contentPlan.pending.length > 0 || contentPlan.extra.length > 0) {
  console.log('')
  console.log(
    `  ! content/ 里有 ${contentPlan.pending.length} 个文件还没同步（源文件夹里更新或新增了），` +
      `${contentPlan.extra.length} 个已过期。`,
  )
  console.log('    图片传上去之后，线上的**文字**还是旧的。发布前跑一次：bun run sync')
}

/*
 * 只登记账本：把每张图的哈希写进 assets.manifest.json（at=0，表示还没真的上传），
 * 不碰网络。用途是"先看看静态站长什么样"——`bun run build` 读的正是这份账本。
 */
if (registryOnly) {
  for (const row of rows) {
    const existing = manifest.objects[row.asset.key]
    manifest.objects[row.asset.key] = {
      sha: row.sha,
      size: row.asset.bytes,
      mtime: row.asset.mtime,
      // 已经传过的保持 at 不动，只补登记新的
      at: isUploaded(existing) && existing.sha === row.sha ? existing.at : 0,
    }
  }
  manifest.bucket = env.bucket
  manifest.prefix = deploy.r2.prefix
  manifest.publicBase = env.publicBase
  manifest.broken = [...brokenKeys].sort()
  manifest.updatedAt = Date.now()
  writeManifest(repoRoot, manifest)

  const notUploaded = Object.values(manifest.objects).filter((entry) => !isUploaded(entry)).length
  console.log('')
  console.log(`  已写进 ${MANIFEST_PATH}：${rows.length} 个对象，其中 ${notUploaded} 个还没真的上传`)
  if (brokenKeys.size > 0) {
    console.log(`  顺手记下 ${brokenKeys.size} 条已知断链（源文件本来就不存在）`)
  }
  console.log('  现在可以跑 bun run build 生成静态站')
  console.log('')
  process.exit(0)
}

if (dryRun) {
  if (changed.length > 0) {
    console.log('')
    console.log('  即将上传：')
    for (const row of changed.slice(0, 5)) {
      console.log(`            ${row.asset.key}  ${humanBytes(row.asset.bytes)}`)
    }
    if (changed.length > 5) console.log(`            …还有 ${changed.length - 5} 个`)
  }
  console.log('')
  console.log('  只登记账本、不上传：bun run publish --registry')
  console.log('  实际上传请跑：    bun run publish')
  console.log('')
  process.exit(0)
}

if (!env.configured) {
  console.log('')
  console.log(`  缺 R2 凭证，不能上传。请在 ${env.envPath} 里填：`)
  console.log('')
  console.log('    R2_ACCOUNT_ID=<Cloudflare 账号 ID>')
  console.log('    R2_ACCESS_KEY_ID=<R2 API Token 的 Access Key ID>')
  console.log('    R2_SECRET_ACCESS_KEY=<对应的 Secret>')
  console.log(`    R2_BUCKET=${env.bucket}                     # 可选，默认取 vault.config.ts`)
  console.log('    R2_PUBLIC_BASE=https://img.example.com  # 可选，站点拼图片 URL 用')
  console.log('')
  console.log('  凭证只在这里读；.env.local 已被 .gitignore 的 *.local 覆盖，构建产物里不会有它们。')
  console.log('')
  process.exit(1)
}

if (changed.length === 0 && goneKeys.length === 0) {
  console.log('')
  console.log('  已经全部在 R2 上了，什么都没做。')
  console.log('')
  process.exit(0)
}

/* ------------------------------------------------------------------ 上传 */

const credentials = env.credentials as R2Credentials
const client = new AwsClient({
  accessKeyId: credentials.accessKeyId,
  secretAccessKey: credentials.secretAccessKey,
  service: 's3',
  region: 'auto',
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function putObject(row: UploadRow): Promise<void> {
  const url = `${credentials.endpoint}/${credentials.bucket}/${encodePath(row.asset.key)}`
  const body = fs.readFileSync(row.asset.abs)
  const response = await client.fetch(url, {
    method: 'PUT',
    body,
    headers: {
      'Content-Type': contentType(row.asset.abs),
      // 图换了 URL 里的 ?v=<sha> 也会跟着换，所以这里可以放心长缓存
      'Cache-Control': 'public, max-age=31536000, immutable',
      // 带上真实的载荷哈希（不写这行 aws4fetch 会用 UNSIGNED-PAYLOAD）：
      // R2 因此会校验字节，manifest 里记的 sha 就等于 R2 上真正存的东西
      'X-Amz-Content-Sha256': row.sha,
    },
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`${response.status} ${response.statusText} ${detail.slice(0, 200)}`.trim())
  }
}

async function putWithRetry(row: UploadRow): Promise<void> {
  let lastError: unknown = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await putObject(row)
      return
    } catch (error) {
      lastError = error
      const message = String(error)
      // 4xx 是请求本身的问题（桶名、权限、key），重试也没用；429 除外
      const bad4xx = /\b4\d\d\b/.test(message) && !message.includes('429')
      if (bad4xx || attempt === 2) break
      await sleep(400 * 2 ** attempt)
    }
  }
  throw lastError
}

async function deleteWithRetry(key: string): Promise<void> {
  const url = `${credentials.endpoint}/${credentials.bucket}/${encodePath(key)}`
  const response = await client.fetch(url, { method: 'DELETE' })
  if (!response.ok && response.status !== 404) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
}

const failures: Array<{ key: string; error: string }> = []
const totalToUpload = changed.length
let done = 0
let uploadedBytes = 0
let savedAt = 0

/**
 * 把账本落盘，让中途断掉的上传可以续。
 *
 * 387 MB 要传十几分钟，中途可能撞上 Ctrl-C、网络抖动、或者我自己的超时。
 * 不在途中保存的话：那些已经传上去的图在账本里还是"没传"，重跑会把 1078 张**全部重传**一遍。
 * 所以每传 100 张就存一次（写入是同步的，几十 KB，不打断上传节奏）。
 */
function saveProgress(): void {
  if (done === savedAt) return
  savedAt = done
  manifest.bucket = env.bucket
  manifest.prefix = deploy.r2.prefix
  manifest.publicBase = env.publicBase
  manifest.updatedAt = Date.now()
  writeManifest(repoRoot, manifest)
}

async function worker(): Promise<void> {
  for (;;) {
    const row = changed.shift()
    if (!row) return
    try {
      await putWithRetry(row)
      manifest.objects[row.asset.key] = {
        sha: row.sha,
        size: row.asset.bytes,
        mtime: row.asset.mtime,
        at: Date.now(),
      }
      uploadedBytes += row.asset.bytes
    } catch (error) {
      failures.push({ key: row.asset.key, error: String(error) })
    }
    done += 1
    if (done % 100 === 0) saveProgress()
    if (done % 50 === 0 || done === totalToUpload) {
      console.log(`  已上传 ${done}/${totalToUpload} · ${humanBytes(uploadedBytes)}`)
    }
  }
}

console.log('')
const workers = Array.from({ length: Math.min(concurrency, totalToUpload) }, () => worker())
const startedAt = Date.now()
await Promise.all(workers)

/* -------------------------------------------------------------- 收尾 */

/*
 * 安全阀：这次有上传失败时，**一个对象都不删**。
 *
 * 删除是这条流水线里唯一不可逆的动作。失败的图通常意味着网络或权限出了问题，
 * 那种时候还要顺手删掉一批旧对象，风险完全不成比例（尤其换前缀、换桶这类迁移，
 * 删掉的就是旧位置的全部内容）。所以先把删除推迟到"这次上传全绿"为止。
 */
const mayDelete = prune && failures.length === 0

if (prune && !mayDelete && goneKeys.length > 0) {
  console.log('')
  console.log(`  ! 这次有 ${failures.length} 个上传失败，所以不删那 ${goneKeys.length} 个旧对象。`)
  console.log('    修好问题重跑一次（全绿之后才会删），或者手动确认后加 --prune 再跑。')
}

for (const key of goneKeys) {
  if (mayDelete) {
    try {
      await deleteWithRetry(key)
      delete manifest.objects[key]
    } catch (error) {
      failures.push({ key, error: `删除失败：${String(error)}` })
    }
  } else if (prune) {
    // 想删但没敢删：留在账本里，下次还有机会
    manifest.orphans[key] = manifest.objects[key]
    delete manifest.objects[key]
  } else {
    manifest.orphans[key] = manifest.objects[key]
    delete manifest.objects[key]
  }
}

// 之前记下的孤儿，如果又回到了上传集合里，就把它从孤儿名单里摘掉
for (const key of Object.keys(manifest.orphans)) {
  if (currentKeys.has(key)) delete manifest.orphans[key]
}

manifest.bucket = env.bucket
manifest.prefix = deploy.r2.prefix
manifest.publicBase = env.publicBase
manifest.broken = [...brokenKeys].sort()
manifest.updatedAt = Date.now()
writeManifest(repoRoot, manifest)

const seconds = ((Date.now() - startedAt) / 1000).toFixed(1)
console.log('')
console.log(`  上传 ${totalToUpload - failures.length}/${totalToUpload} 个 · 耗时 ${seconds}s · ${humanBytes(uploadedBytes)}`)
if (goneKeys.length > 0) {
  console.log(`  ${prune ? '已删除' : '保留在 R2 上'}：${goneKeys.length} 个孤儿对象`)
}
if (failures.length > 0) {
  console.log('')
  console.log(`  ${failures.length} 个失败（重跑一次会自动续传，没变的不会重传）：`)
  for (const failure of failures.slice(0, 10)) {
    console.log(`    ${failure.key}`)
    console.log(`      ${failure.error}`)
  }
  if (failures.length > 10) console.log(`    …还有 ${failures.length - 10} 个`)
  console.log('')
  process.exit(1)
}

if (env.publicBase) {
  const sample = assets.find((asset) => manifest.objects[asset.key])
  if (sample) {
    console.log(`  抽查一张：${publicUrl(env.publicBase, sample.key, manifest.objects[sample.key].sha)}`)
  }
} else {
  console.log('  提示：还没配 R2_PUBLIC_BASE，站点拼不出图片 URL（上传本身没问题）')
}
console.log('')
