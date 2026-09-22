/** 路径工具。和服务端 plugins/vault/utils.ts 里的同名函数行为一致，但客户端不能 import 它（那边依赖 node:path）。 */

/** 逐段编码。整串 encodeURIComponent 会把 / 也编掉。 */
export function encodePath(relPath: string): string {
  return relPath.split('/').map(encodeURIComponent).join('/')
}

/** 反解回未编码的相对路径 */
export function decodePath(urlPath: string): string {
  try {
    return urlPath
      .split('/')
      .map(decodeURIComponent)
      .join('/')
  } catch {
    return urlPath
  }
}
