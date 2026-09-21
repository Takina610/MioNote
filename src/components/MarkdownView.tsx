import { isValidElement, useMemo, useState, type ReactNode } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Highlighter } from 'shiki'
import type { ImageRefMap } from '../../shared/types'
import { Icon } from './Icon'
import { CodeView } from './CodeView'

interface MarkdownViewProps {
  markdown: string
  imageRefs: ImageRefMap
  highlighter: Highlighter | null
}

/**
 * 图片引用查表。
 *
 * markdown 里写的是 `./img3/xxx.png`，服务端解析后给出的键是原文，
 * 但 react-markdown 可能会把 src 规范化（比如去掉 `./`、解一次 URL 编码）。
 * 所以两边都归一化一遍再来查，避免明明图在却显示成断链。
 */
function lookupImage(refs: ImageRefMap, src: string): string | null | undefined {
  const decode = (s: string) => {
    try {
      return decodeURIComponent(s)
    } catch {
      return s
    }
  }
  const candidates = new Set<string>()
  for (const base of [src, decode(src)]) {
    candidates.add(base)
    candidates.add(base.replace(/^\.\//, ''))
  }
  for (const candidate of candidates) {
    if (candidate in refs) return refs[candidate]
  }
  return undefined
}

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children)
  return ''
}

function CodeBlock({
  children,
  highlighter,
}: {
  children?: ReactNode
  highlighter: Highlighter | null
}) {
  const [copied, setCopied] = useState(false)

  const codeElement = Array.isArray(children) ? children[0] : children
  const isElement = isValidElement(codeElement)
  const props = isElement
    ? (codeElement.props as { className?: string; children?: ReactNode })
    : undefined
  const className = props?.className ?? ''
  const lang = /language-([\w+#.-]+)/.exec(className)?.[1] ?? ''
  const code = isElement ? textOf(props?.children ?? children).replace(/\n$/, '') : ''

  const copy = () => {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    })
  }

  // 不是标准的 ``` 代码块（比如内联 HTML），原样放着就行
  if (!isElement) return <pre>{children}</pre>

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span className="code-block__lang">{lang || 'text'}</span>
        <button type="button" className="code-block__copy" onClick={copy}>
          <Icon name={copied ? 'check' : 'copy'} size={13} />
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <CodeView code={code} lang={lang} highlighter={highlighter} className="code-block__body" />
    </div>
  )
}

export function MarkdownView({ markdown, imageRefs, highlighter }: MarkdownViewProps) {
  const components = useMemo<Components>(
    () => ({
      pre: ({ children }) => <CodeBlock highlighter={highlighter}>{children}</CodeBlock>,

      img: ({ src, alt }) => {
        const raw = typeof src === 'string' ? src : ''
        const resolved = lookupImage(imageRefs, raw)

        if (typeof resolved === 'string') {
          return (
            <img
              className="note-image"
              src={resolved}
              alt={alt ?? ''}
              loading="lazy"
              decoding="async"
            />
          )
        }
        if (resolved === null) {
          return (
            <span className="note-image--broken" title="这个引用指向的文件不存在">
              <span className="note-image--broken__alt">{alt || raw || '图片'}</span>
              <span className="note-image--broken__ref">{raw}</span>
            </span>
          )
        }
        // 不在表里的引用：外链直接放行，其余当断链处理
        if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:image/')) {
          return <img className="note-image" src={raw} alt={alt ?? ''} loading="lazy" />
        }
        return (
          <span className="note-image--broken" title="无法解析的图片引用">
            <span className="note-image--broken__alt">{alt || raw || '图片'}</span>
            <span className="note-image--broken__ref">{raw}</span>
          </span>
        )
      },

      a: ({ href, children }) => {
        const url = href ?? ''
        const external = /^(https?:)?\/\//i.test(url)
        return (
          <a href={url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
            {children}
          </a>
        )
      },
    }),
    [highlighter, imageRefs],
  )

  return (
    <div className="markdown">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </Markdown>
    </div>
  )
}
