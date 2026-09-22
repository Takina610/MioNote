import { useState } from 'react'
import { Icon } from './Icon'

interface CopyButtonProps {
  /** 要复制到剪贴板的文本 */
  text: string
  className?: string
}

/**
 * 复制按钮。
 *
 * markdown 的代码块、源码文件页、demo 的「看源码」三处共用，所以「按下去之后会怎样」
 * 只有这一份实现：变成「已复制」，1.2 秒后自己变回来。
 *
 * 剪贴板 API 只在安全上下文（https / localhost）里存在，取不到就什么也不做——
 * 与弹个提示相比，这里的取舍是「安静地失败好过打断阅读」：读的人按完立刻会去粘贴，
 * 成没成一眼就能看出来。失败路径必须显式接住（.then 的第二个参数），
 * 否则权限被拒时会往控制台扔一条未处理的拒绝。
 */
export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
      },
      () => {},
    )
  }

  return (
    <button
      type="button"
      className={className ? `copy-btn ${className}` : 'copy-btn'}
      title={copied ? '已复制' : '复制到剪贴板'}
      onClick={copy}
    >
      <Icon name={copied ? 'check' : 'copy'} size={13} />
      {copied ? '已复制' : '复制'}
    </button>
  )
}
