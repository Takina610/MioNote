import fs from 'node:fs'
import type { ServerResponse } from 'node:http'
import type { Connect, Plugin, ViteDevServer } from 'vite'
import type { PublishLevel, VaultConfig } from '../../shared/types.ts'
import { VaultStore } from './store.ts'
import { contentType } from './utils.ts'

const API_PREFIX = '/api/'
const ASSET_PREFIX = '/@vault/'

/**
 * 把磁盘上的笔记文件夹变成一个只读内容服务。
 *
 * 这里实现的是 ContentSource 契约的「本地」版本：
 * 浏览器和 React 只认 /api/* 和 /@vault/*，将来 Tauri 用 IPC、云端用静态文件
 * 各自实现同一套约定，界面代码一行都不用改。
 *
 * 这个插件只做「读」：没有上传、没有发布状态、也没有手动重扫的入口。
 * 笔记改动靠文件监听自动发现，监听失灵时重启 dev server 即可。
 */
export function vaultPlugin(config: VaultConfig): Plugin {
  const store = new VaultStore(config)

  return {
    name: 'mionote:vault',
    apply: 'serve',

    configureServer(server) {
      server.middlewares.use(createHandler(server, store))
      attachWatchers(server, store, config)

      const report = () => printReport(server, store)
      if (server.httpServer) server.httpServer.once('listening', report)
      else report()
    },
  }
}

function createHandler(server: ViteDevServer, store: VaultStore): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url ?? '/'
    const queryAt = url.indexOf('?')
    const rawPath = queryAt === -1 ? url : url.slice(0, queryAt)
    const query = new URLSearchParams(queryAt === -1 ? '' : url.slice(queryAt + 1))

    if (rawPath.startsWith(ASSET_PREFIX)) {
      serveAsset(store, res, rawPath)
      return
    }

    if (!rawPath.startsWith(API_PREFIX)) {
      next()
      return
    }

    const endpoint = rawPath.slice(API_PREFIX.length)
    try {
      switch (endpoint) {
        case 'vault': {
          sendJson(res, store.getIndex())
          return
        }
        case 'note': {
          const section = query.get('section') ?? ''
          const rel = query.get('path') ?? ''
          const note = store.getNote(section, rel)
          if (!note) sendError(res, 404, `找不到笔记：${section}/${rel}`)
          else sendJson(res, note)
          return
        }
        case 'demo': {
          const demo = store.getDemo(query.get('section') ?? '', query.get('path') ?? '')
          if (!demo) sendError(res, 404, '找不到 demo')
          else sendJson(res, demo)
          return
        }
        case 'file': {
          const file = store.getFile(query.get('section') ?? '', query.get('path') ?? '')
          if (!file) sendError(res, 404, '找不到文件（只允许读取已索引的文本文件）')
          else sendJson(res, file)
          return
        }
        case 'search-index': {
          sendJson(res, store.getSearchIndex())
          return
        }
        default:
          sendError(res, 404, `未知接口：${endpoint}`)
          return
      }
    } catch (error) {
      server.config.logger.error(`[mionote] ${endpoint} 出错：${String(error)}`)
      sendError(res, 500, String(error))
    }
  }
}

/** 以流的方式把资源吐出去。1 GB 的 demo 资源不会被读进内存。 */
function serveAsset(store: VaultStore, res: ServerResponse, rawPath: string): void {
  const segments = rawPath.slice(ASSET_PREFIX.length).split('/')
  const sectionId = segments.shift() ?? ''

  let rel: string
  try {
    rel = segments.map((s) => decodeURIComponent(s)).join('/')
  } catch {
    res.statusCode = 400
    res.end('bad path encoding')
    return
  }

  const abs = store.resolveAssetPath(sectionId, rel)
  if (!abs) {
    res.statusCode = 404
    res.end('not found')
    return
  }

  res.statusCode = 200
  res.setHeader('Content-Type', contentType(abs))
  res.setHeader('Cache-Control', 'no-cache')

  const stream = fs.createReadStream(abs)
  stream.on('error', () => {
    if (!res.headersSent) res.statusCode = 500
    res.end()
  })
  stream.pipe(res)
}

function sendJson(res: ServerResponse, data: unknown): void {
  const body = JSON.stringify(data)
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(body)
}

function sendError(res: ServerResponse, status: number, message: string): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ error: message }))
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 监听笔记文件夹，改动后让前端重新取数据。
 *
 * 没有"手动重新扫描"的入口（那个按钮去掉了）：递归监听在个别环境下会失灵，
 * 但那种情况下重启 dev server 就够了，不值得为它在界面上常驻一个按钮。
 */
function attachWatchers(server: ViteDevServer, store: VaultStore, config: VaultConfig): void {
  const ignoreRe =
    config.ignoreDirs.length > 0
      ? new RegExp(`(^|[\\\\/])(${config.ignoreDirs.map(escapeRegExp).join('|')})([\\\\/]|$)`)
      : null

  let timer: NodeJS.Timeout | null = null
  const pending = new Set<string>()
  // fs.watch 递归监听起来时会先报一批已存在的文件，那不是真的改动。
  // 不设宽限期的话每次启动都会白重建一次索引，日志里还会出现假的「笔记已更新」。
  const startedAt = Date.now()
  const GRACE_MS = 2500

  const flush = () => {
    timer = null
    const files = [...pending]
    pending.clear()
    store.invalidate()
    store.getIndex() // 立即重建，这样前端拿到的是新数据而不是等下一次请求
    const hot = server.hot ?? server.ws
    hot.send({ type: 'custom', event: 'vault:changed', data: { at: Date.now(), files } })
    const shown = files.slice(0, 3).join('、')
    server.config.logger.info(
      `[mionote] 笔记已更新：${shown}${files.length > 3 ? ` 等 ${files.length} 个文件` : ''}`,
    )
  }

  const watchers: fs.FSWatcher[] = []

  for (const section of config.sections) {
    if (!fs.existsSync(section.root)) continue
    try {
      const watcher = fs.watch(section.root, { recursive: true }, (_event, filename) => {
        if (Date.now() - startedAt < GRACE_MS) return
        const name = typeof filename === 'string' ? filename : ''
        if (name && ignoreRe?.test(name)) return
        if (name) pending.add(name)
        if (timer) clearTimeout(timer)
        timer = setTimeout(flush, 400)
      })
      watcher.on('error', (error) => {
        server.config.logger.warn(`[mionote] 监听 ${section.name} 出错：${String(error)}`)
      })
      watchers.push(watcher)
    } catch (error) {
      server.config.logger.warn(
        `[mionote] 无法监听 ${section.name}（${section.root}）：${String(error)}。` +
          '改动不会自动刷新，用侧栏底部的「重新扫描」。',
      )
    }
  }

  const close = () => {
    if (timer) clearTimeout(timer)
    for (const w of watchers) w.close()
  }
  server.httpServer?.once('close', close)
  server.ws.on('close', close)
}

const PUBLISH_LABEL: Record<PublishLevel, string> = {
  public: '公开',
  private: '需登录',
  never: '不发布',
}

function printReport(server: ViteDevServer, store: VaultStore): void {
  const index = store.getIndex()
  const log = server.config.logger.info

  log('')
  log(`  MioNote · 已索引 ${index.sections.length} 个笔记文件夹（${index.scanMs} ms）`)
  log(
    `  笔记 ${index.stats.notes} 篇 · demo ${index.stats.demos} 个 · 源码 ${
      index.sections.reduce((sum, s) => sum + s.counts.codes, 0)
    } 个 · 正文 ${formatBytes(index.stats.noteBytes)}`,
  )
  log('')

  const nameWidth = Math.max(...index.sections.map((s) => displayWidth(s.name)), 0)
  for (const section of index.sections) {
    const pad = ' '.repeat(Math.max(nameWidth - displayWidth(section.name), 0))
    const flag = section.publish === 'never' ? '禁' : '  '
    log(
      `    ${flag} ${section.name}${pad}   笔记 ${String(section.counts.notes).padStart(3)} · demo ${String(
        section.counts.demos,
      ).padStart(3)} · 源码 ${String(section.counts.codes).padStart(4)}   ${
        PUBLISH_LABEL[section.publish]
      }   ${section.available ? '' : '（目录不存在）'}`,
    )
  }

  log('')
  for (const warning of index.warnings) log(`  ! ${warning}`)
  log('')
}

/** 终端里中文字符占两格，对齐要按显示宽度算 */
function displayWidth(s: string): number {
  let w = 0
  for (const ch of s) w += /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe6f\uff00-\uff60\uffe0-\uffe6]/.test(ch) ? 2 : 1
  return w
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
