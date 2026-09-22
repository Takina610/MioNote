/**
 * 扩展名 → shiki 语言 id。
 *
 * 一处定义、两处使用：
 *
 *   · 服务端（plugins/vault/store.ts）拿它算「源码文件需要哪些语法」，
 *     合并进索引里的 `stats.languages`——客户端照那份清单一次性加载高亮语法。
 *   · 客户端（src/components/CodeView.tsx）拿它决定某个文件按什么语言渲染。
 *
 * 两边必须一致，所以放在 shared/ 而不是各写一份：分叉的代价是**安静的**——
 * shiki 手上没有那个语法时会抛错、代码块退化成纯文本，看起来"只是没高亮"，
 * 很难想到是这张表少了一项。
 *
 * 表里的值都是 shiki `bundledLanguages` 里真实存在的 id。`.htm` 是唯一的例外：
 * 它没有自己的语法，按 html 渲染。`.txt` 这种没有语法的扩展名**不写进来**，
 * `langForExt` 返回 undefined，调用方就按纯文本展示。
 *
 * 在 vault.config.ts 的 `codeExtensions` 里加扩展名时，顺手在这里加一行；
 * 漏了不会报错，只是那个文件没高亮。
 */
export const CODE_LANG_BY_EXT: Record<string, string> = {
  js: 'js',
  mjs: 'mjs',
  cjs: 'cjs',
  ts: 'ts',
  tsx: 'tsx',
  jsx: 'jsx',
  vue: 'vue',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  yaml: 'yaml',
  yml: 'yml',
  xml: 'xml',
  ini: 'ini',
  sh: 'sh',
  ps1: 'ps1',
  py: 'py',
  java: 'java',
  cs: 'cs',
  sql: 'sql',
  md: 'md',
  html: 'html',
  htm: 'html',
}

/** `.vue` / `vue` 都能认。未知扩展名返回 undefined（调用方退化成纯文本）。 */
export function langForExt(ext: string): string | undefined {
  return CODE_LANG_BY_EXT[ext.replace(/^\./, '').toLowerCase()]
}
