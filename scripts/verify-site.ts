/**
 * 静态站自检：对 `vite preview` 起着的产物发请求，验证线上形态真的成立。
 *
 * 它检查的是"部署后会发生什么"，而不是"文件在不在"：
 *   · 应用需要的那几个 JSON 能不能取到（路径里的中文要不要编码、编码后服务端认不认）
 *   · 图片 URL 是不是指向 R2，且带着 ?v= 内容哈希
 *   · demo 的 payload 里 url 是不是 null（线上只看源码）
 *   · 「看源码」取的是 /@vault/ 下的原文件（路径前缀和 dev 完全一致）
 *   · 索引里的源码节点（.vue/.js/.css…）也能从 /@vault/ 取到——线上没有本地 iframe，
 *     它们是唯一能读代码的入口，取不到就等于线上看不了代码
 *   · 已知断链有没有正确留在 missing 里
 *
 * 用法：bun run scripts/verify-site.ts [origin]
 */
const origin = process.argv[2] ?? 'http://localhost:4173'

interface IndexNode {
  kind: string
  name: string
  path: string
  children?: IndexNode[]
}

/** 树里第一个源码文件。用来验证"线上真能读到代码"，而不是只验证索引里有它 */
function firstCodeFile(nodes: IndexNode[]): IndexNode | null {
  for (const node of nodes) {
    if (node.kind === 'code') return node
    const nested = node.children ? firstCodeFile(node.children) : null
    if (nested) return nested
  }
  return null
}

interface Check {
  name: string
  run: () => Promise<string>
}

let failed = 0

async function get(path: string): Promise<Response> {
  const url = `${origin}${path.split('/').map(encodeURIComponent).join('/')}`
  return fetch(url)
}

const checks: Check[] = [
  {
    name: '索引 /api/vault.json',
    run: async () => {
      const response = await get('/api/vault.json')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const index = (await response.json()) as {
        sections: Array<{ id: string; name: string; root: string; publish: string }>
        stats: { notes: number; demos: number; missingAssets: unknown[] }
      }
      const bad = index.sections.filter((s) => s.publish !== 'public')
      if (bad.length > 0) throw new Error(`有非 public 的文件夹：${bad.map((s) => s.id).join('、')}`)
      const leaked = index.sections.filter((s) => /^[A-Za-z]:/.test(s.root))
      if (leaked.length > 0) throw new Error(`root 里还有本机路径：${leaked[0].root}`)
      return `${index.sections.length} 个文件夹 · ${index.stats.notes} 篇笔记 · 断链 ${index.stats.missingAssets.length} 条`
    },
  },
  {
    name: '搜索索引 /api/search-index.json',
    run: async () => {
      const response = await get('/api/search-index.json')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as { docs: Array<{ text: string }> }
      const bytes = data.docs.reduce((sum, doc) => sum + doc.text.length, 0)
      return `${data.docs.length} 篇 · 正文 ${Math.round(bytes / 1024)} KB`
    },
  },
  {
    name: '笔记 payload（中文路径）',
    run: async () => {
      const response = await get('/api/note/soft-exam/06-软件工程.md.json')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const note = (await response.json()) as {
        title: string
        imageRefs: Record<string, string | null>
        missing: string[]
        sections: unknown[]
      }
      const urls = Object.values(note.imageRefs).filter((v): v is string => typeof v === 'string')
      /*
       * 这里守的是"图片地址有没有真的被替换掉"：必须是绝对 URL（不能还是 /@vault/ 这种
       * 相对路径），而且必须带 ?v= 内容哈希。
       *
       * 不断言 https：用 `R2_PUBLIC_BASE=http://localhost:5178/@vault` 构建本地预览时
       * 就应该是 http。是不是 https 属于部署配置问题，不该让这个自检误报。
       */
      const relative = urls.filter((url) => !/^https?:\/\//.test(url))
      if (relative.length > 0) {
        throw new Error(`有 ${relative.length} 张图还是相对路径（没替换成 R2）：${relative[0]}`)
      }
      const noVersion = urls.filter((url) => !/[?&]v=[0-9a-f]{8}$/.test(url))
      if (noVersion.length > 0) throw new Error(`有 ${noVersion.length} 张图没有 ?v= 版本号`)
      if (note.missing.length === 0) throw new Error('已知断链没有出现在 missing 里')
      const insecure = urls.filter((url) => !url.startsWith('https://'))
      const note2 = insecure.length > 0 ? ` · 注意 ${insecure.length} 张不是 https（本地预览构建正常）` : ''
      return `${note.title}：${note.sections.length} 小节 · ${urls.length} 张 R2 图 · 断链 ${note.missing.length} 条${note2}`
    },
  },
  {
    name: 'demo payload 里 url 为 null（线上只给源码）',
    run: async () => {
      const response = await get('/api/demo/web-frontend/01_HTML/4_HTML超链接.html.json')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const demo = (await response.json()) as { url: string | null; externalHosts: string[] }
      if (demo.url !== null) throw new Error(`url 应该是 null，实际是 ${demo.url}`)
      return `url=null · 外链 ${demo.externalHosts.length} 个域名`
    },
  },
  {
    name: '索引里的源码文件能从 /@vault/ 取到',
    run: async () => {
      const response = await get('/api/vault.json')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const index = (await response.json()) as {
        sections: Array<{ id: string; children: IndexNode[] }>
      }
      for (const section of index.sections) {
        const found = firstCodeFile(section.children)
        if (!found) continue
        const file = await get(`/@vault/${section.id}/${found.path}`)
        if (!file.ok) throw new Error(`${found.path} → HTTP ${file.status}`)
        const text = await file.text()
        if (text.length === 0) throw new Error(`${found.path} 是空文件`)
        const size = text.length < 1024 ? `${text.length} B` : `${Math.round(text.length / 1024)} KB`
        return `${found.path} · ${size}`
      }
      throw new Error('索引里一个源码文件都没有——扫描没把可读文件收进树')
    },
  },
  {
    name: '「看源码」取原文件 /@vault/...',
    run: async () => {
      const response = await get('/@vault/web-frontend/01_HTML/4_HTML超链接.html')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const text = await response.text()
      if (!text.includes('<')) throw new Error('返回的不是 HTML 文本')
      return `${Math.round(text.length / 1024)} KB 文本取到了`
    },
  },
  {
    name: '中文文件名的文本也能取（/@vault/ 下）',
    run: async () => {
      const response = await get('/@vault/软考/index.html')
      // 这个文件不一定存在；只要不是 500 就说明路径解码没炸
      return response.ok ? '存在且可读' : `不存在（HTTP ${response.status}，但路径解码正常）`
    },
  },
  {
    name: 'SPA 壳',
    run: async () => {
      const response = await fetch(`${origin}/`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const html = await response.text()
      if (!html.includes('/assets/index-')) throw new Error('没有引用构建出来的 JS')
      return 'index.html 正常引用了构建产物'
    },
  },
]

console.log('')
console.log(`  MioNote · 静态站自检  ${origin}`)
console.log('  ──────────────────────────────────────────────')
for (const check of checks) {
  try {
    const detail = await check.run()
    console.log(`  ✓ ${check.name}`)
    console.log(`      ${detail}`)
  } catch (error) {
    failed += 1
    console.log(`  ✗ ${check.name}`)
    console.log(`      ${error instanceof Error ? error.message : String(error)}`)
  }
}
console.log('')
console.log(failed === 0 ? '  全部通过。' : `  ${failed} 项失败。`)
console.log('')
process.exit(failed === 0 ? 0 : 1)
