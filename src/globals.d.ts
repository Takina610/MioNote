/**
 * 由 vite.config.ts 的 `define` 注入，值来自 vault.config.ts 的 maxCodeBytes。
 *
 * 用构建期常量而不是运行时配置：客户端不该为了一个截断阈值多请求一次接口，
 * 而且这个值本来就必须和构建时用的一致（demo 的「可读」标记是构建时算的）。
 */
declare const __MAX_CODE_BYTES__: number
