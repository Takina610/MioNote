type Props = { a: number; b: string; c: boolean }

// 将一个类型中的所有属性映射到另一个类型中
type Type = { [key in keyof Props]: Props[key] }

// 其实这就是 Partial 的实现原理
// type Partial = { [P in keyof T]?: T[P] }

const obj: Type = {
  a: 1,
  b: '2',
  c: true
}

export {}

