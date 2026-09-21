import {
  bundledLanguages,
  createHighlighter,
  createJavaScriptRegexEngine,
  type Highlighter,
} from 'shiki'

/**
 * 用 github 明暗两套主题，输出里会带上 --shiki-dark / --shiki-dark-bg 变量，
 * 这样切换暗色模式只需要改 CSS，不用重新高亮一遍。
 */
export const SHIKI_THEMES = { light: 'github-light', dark: 'github-dark' } as const

let pending: Promise<Highlighter> | null = null

/**
 * 只加载笔记里真正出现过的语言。
 * 服务端扫描时会统计出语言清单（bash/json/js/html/csharp/java/yaml…），
 * 这里照单加载，不把 shiki 那几百种语法全拖进浏览器。
 */
export function initHighlighter(languages: string[]): Promise<Highlighter> {
  if (!pending) {
    const usable = [...new Set(languages)].filter((l) => l in bundledLanguages)
    pending = createHighlighter({
      themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
      langs: usable,
      // JS 正则引擎，省掉 600 KB 的 oniguruma wasm
      engine: createJavaScriptRegexEngine(),
    })
  }
  return pending
}

/**
 * 同步高亮，失败就返回 null 让调用方退化成纯文本。
 *
 * 刻意不做「异步加载语法再重渲染」那套：语言清单在启动时就一次性加载完了，
 * 真出现没覆盖到的语言（比如新写的笔记用了 rust），退化成等宽纯代码也照样能读，
 * 比让代码块闪一下再变高亮好。
 */
export function highlightCode(
  highlighter: Highlighter | null,
  code: string,
  lang: string,
): string | null {
  if (!highlighter || !lang) return null
  if (!(lang in bundledLanguages)) return null
  try {
    return highlighter.codeToHtml(code, { lang, themes: SHIKI_THEMES })
  } catch {
    return null
  }
}
