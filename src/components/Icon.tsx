import { CHROME_ICONS, ICONS } from '../generated/icons'

/**
 * 界面图标（搜索、关闭、刷新这类）。
 *
 * 用 VS Code 自己的界面图标集 Codicons——Material Icon Theme 是「文件图标主题」，
 * 里面没有这一类的图标。两个集合并用正是 VS Code 自己的做法。
 *
 * 这些图标是单色的，继承 `currentColor`，所以颜色由 CSS 决定，明暗主题都不用管。
 */
export type IconName = keyof typeof CHROME_ICONS

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 16, className }: IconProps) {
  const data = ICONS[CHROME_ICONS[name]]
  if (!data) return null

  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox={data.viewBox}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      // 内容由 scripts/generate-icons.mjs 在构建时生成并做了元素/属性白名单过滤，
      // 不是用户输入，也不含事件处理器——这里注入是安全的。
      dangerouslySetInnerHTML={{ __html: data.body }}
    />
  )
}
