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
 * 内容按当前策略是**快照**：dev server 启动时扫一次，之后一直用这份；
 * 改了笔记重启 dev server 就能看到。不做文件监听、不做运行中重建——
 * 外部程序（云同步、索引器）碰一下笔记文件夹就会触发重建，把前端的
 * 内容缓存反复清空，"首次打开闪一下"这类问题全是它带出来的。
 */
export function vaultPlugin(config: VaultConfig): Plugin {
  const store = new VaultStore(config)

  return {
    name: 'mionote:vault',
    apply: 'serve',

    configureServer(server) {
      server.middlewares.use(createHandler(server, store))

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
