/**
 * 上传前预检（不破坏任何东西）。
 *
 * 传 387 MB 之前要确认这几件事，否则可能白传半小时才发现问题：
 *   1. 凭证能不能用、**桶到底在不在**（用列对象判断，不能靠 HEAD 一个 key——
 *      桶不存在和 key 不存在都返回 404，分不出来。这是踩过的坑）
 *   2. 这个桶是不是给 MioNote 专用的。**如果不是空的，要等你确认**——你可能
 *      把它用在别处（甚至放着敏感文件），而它挂着公共域名
 *   3. 有没有**写**权限（PUT 一个 1 字节的探针，然后删掉）
 *   4. 公共域名能不能读到刚传上去的东西（线上图片能不能显示的唯一硬证据）
 *
 * 探针的 key 是 `.preflight`，放在桶根，跑完就删。
 *
 * 用法：bun run scripts/preflight.ts [桶名]
 */
import { AwsClient } from 'aws4fetch'
import { deploy, vault } from '../vault.config.ts'
import { assetKey, bucketLabel, readR2Env, type R2Credentials } from '../plugins/vault/deploy.ts'

const PROBE_KEY = '.preflight'

/** MioNote 在桶里只用的那些顶层前缀（= 各笔记文件夹的 id） */
const SECTION_IDS = vault.sections.filter((s) => s.publish !== 'never').map((s) => s.id)

const env = readR2Env(process.cwd(), deploy)
if (!env.configured) {
  console.error(`\n  缺凭证：${env.missing.join('、')}（在 .env.local 里填）\n`)
  process.exit(1)
}

/** 命令行可以临时指定桶名，方便试别的桶 */
const bucketName = process.argv[2]?.trim() || env.bucket

const credentials = { ...(env.credentials as R2Credentials), bucket: bucketName }
const client = new AwsClient({
  accessKeyId: credentials.accessKeyId,
  secretAccessKey: credentials.secretAccessKey,
  service: 's3',
  region: 'auto',
})

const objectUrl = (key: string) => `${credentials.endpoint}/${credentials.bucket}/${key}`

console.log('')
console.log('  MioNote · R2 上传前预检')
console.log('  ──────────────────────────────────────────────')
console.log(`  桶        ${credentials.bucket}`)
console.log(`  桶内路径  ${bucketLabel(credentials.bucket, deploy.r2.prefix)}`)
console.log(`  端点      ${credentials.endpoint}`)
console.log(`  公共域名  ${env.publicBase || '(没配)'}`)
console.log('')

let failures = 0
const ok = (label: string, detail: string) => console.log(`  ✓ ${label}\n      ${detail}`)
const bad = (label: string, detail: string) => {
  failures += 1
  console.log(`  ✗ ${label}\n      ${detail}`)
}

/* 1. 桶在不在：用列对象判断（HEAD 一个 key 分不清"桶没有"和"key 没有"） */
try {
  const response = await client.fetch(`${credentials.endpoint}/${credentials.bucket}?list-type=2&max-keys=1000`, {
    method: 'GET',
  })
  const text = await response.text()
  if (response.ok) {
    const keys = [...text.matchAll(/<Key>([^<]*)<\/Key>/g)].map((m) => m[1])
    const truncated = /<IsTruncated>true<\/IsTruncated>/.test(text)

    /*
     * 桶不是空的就要说清楚它里面有什么。
     *
     * 为什么这条检查值得写进预检：这个桶可能不是你为 MioNote 建的。
     * 实测遇到的真实情况是——用户填的桶名不存在（只给了凭证），而账号里唯一的桶
     * 装着个人文件（包括带 uuid 的代理配置），并且它挂着公共域名。
     * 那种时候需要的不是"继续上传"，而是先停下来让人看一眼。
     */
    if (keys.length === 0) {
      ok('桶存在，而且是空的', `${credentials.bucket} 里没有任何对象`)
    } else {
      // 哪些对象是 MioNote 自己的：key 以「前缀 + section id」开头
      const topLevel = new Map<string, number>()
      for (const key of keys) {
        if (key === PROBE_KEY) continue
        if (SECTION_IDS.some((id) => key.startsWith(assetKey(deploy.r2.prefix, id, '')))) continue
        const prefix = key.includes('/') ? key.split('/')[0] : '(根目录文件)'
        topLevel.set(prefix, (topLevel.get(prefix) ?? 0) + 1)
      }

      if (topLevel.size === 0) {
        ok('桶存在，里面都是 MioNote 的对象', `${keys.length} 个对象，可以继续`)
      } else {
        console.log(`  ! 桶存在，但里面还有不属于 MioNote 的 ${topLevel.size} 组对象${truncated ? '（列表已截断）' : ''}`)
        console.log('      不属于 MioNote 的：')
        for (const [prefix, count] of [...topLevel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
          console.log(`        ${String(count).padStart(5)} 个  ${prefix}`)
        }
        console.log('')
        console.log(`      MioNote 只用这个路径：${bucketLabel(credentials.bucket, deploy.r2.prefix)}`)
        console.log('      不会覆盖上面那些对象（删除也只删自己上传过的），')
        console.log('      但如果这个桶是你在别处用的、或者它挂着公共域名，先确认一下再继续。')
      }
    }
  } else if (response.status === 404 || text.includes('NoSuchBucket')) {
    bad(
      `桶不存在：${credentials.bucket}`,
      '去 R2 控制台建一个（名字要和这里一致），或者在 .env.local 里写 R2_BUCKET=<真实桶名>',
    )
  } else if (response.status === 403) {
    bad(
      '签名被拒绝（403）',
      '检查 R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY 是否对应同一套 token',
    )
  } else {
    bad(`列对象失败（${response.status}）`, text.replace(/\s+/g, ' ').slice(0, 200))
  }
} catch (error) {
  bad('连不上 R2', `${String(error)}（检查网络，或者账号 ID 是不是写错了）`)
}


/* 2. 写权限：PUT 一个探针 */
let wrote = false
if (failures === 0) {
  try {
    const body = new TextEncoder().encode(`mionote preflight ${new Date().toISOString()}\n`)
    const response = await client.fetch(objectUrl(PROBE_KEY), {
      method: 'PUT',
      body,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
    if (response.ok) {
      wrote = true
      ok('有写权限', `PUT 成功（${body.length} 字节）`)
    } else {
      const detail = await response.text().catch(() => '')
      bad(
        `写被拒绝（${response.status}）`,
        `${detail.slice(0, 160)}\n      token 权限要是 Object Read & Write，且限定到这个桶`,
      )
    }
  } catch (error) {
    bad('写请求失败', String(error))
  }
}

/* 3. 公共读：从公共域名取刚传上去的东西 */
if (wrote && env.publicBase) {
  const url = `${env.publicBase.replace(/\/+$/, '')}/${PROBE_KEY}`
  try {
    const response = await fetch(url, { cache: 'no-store' })
    const text = await response.text()
    if (response.ok && text.includes('mionote preflight')) {
      ok('公共域名能读到', `${url}\n      返回了刚传上去的内容 —— 线上图片会正常显示`)
    } else if (response.ok) {
      bad('公共域名返回了别的内容', `${url}\n      HTTP ${response.status}：${text.slice(0, 120)}`)
    } else {
      bad(
        `公共域名读不到（HTTP ${response.status}）`,
        `${url}\n      R2 → 桶 → Settings → Public access 里的自定义域名要指向这个桶，且 DNS 已生效`,
      )
    }
  } catch (error) {
    bad(
      '公共域名连不上',
      `${url}\n      ${String(error)}\n      DNS 可能还没生效，或者域名没在 R2 里绑定`,
    )
  }
} else if (!env.publicBase) {
  bad('没配公共域名', 'R2_PUBLIC_BASE 为空 —— 构建时拼不出图片 URL（见 .env.example）')
}

/* 清理探针 */
if (wrote) {
  try {
    const response = await client.fetch(objectUrl(PROBE_KEY), { method: 'DELETE' })
    if (response.ok || response.status === 404) {
      console.log(`\n  已删除探针对象 ${PROBE_KEY}`)
    } else {
      console.log(`\n  ! 探针对象没删掉（HTTP ${response.status}），你可以手动删：${PROBE_KEY}`)
    }
  } catch (error) {
    console.log(`\n  ! 删除探针时出错：${String(error)}；桶里留了个 ${PROBE_KEY}，无妨`)
  }
}

console.log('')
if (failures === 0) {
  console.log('  预检通过，可以开始上传。')
} else {
  console.log(`  ${failures} 项没过，先解决再传（否则可能传一半才发现）。`)
}
console.log('')
process.exit(failures === 0 ? 0 : 1)
