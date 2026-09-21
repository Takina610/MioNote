import { useMemo } from 'react'
import type { Highlighter } from 'shiki'
import { highlightCode } from '../lib/highlighter'

/**
 * 只读代码视图。shiki 高亮失败就退化成等宽纯文本——
 * 语言没覆盖到（比如新笔记里写了 rust）不该让代码看不见。
 */
export function CodeView({
  code,
  lang,
  highlighter,
  className,
}: {
  code: string
  lang: string
  highlighter: Highlighter | null
  className?: string
}) {
  const html = useMemo(
    () => highlightCode(highlighter, code, lang),
    [highlighter, code, lang],
  )

  if (html) {
    return (
      <div
        className={className ? `code-view ${className}` : 'code-view'}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    <pre className={className ? `code-view code-view--plain ${className}` : 'code-view code-view--plain'}>
      <code>{code}</code>
    </pre>
  )
}

export function langFromExt(ext: string): string {
  return ext.replace(/^\./, '').toLowerCase()
}
