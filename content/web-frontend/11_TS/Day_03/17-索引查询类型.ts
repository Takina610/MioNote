type Props = { a: number; b: string; c: boolean }

// 索引查询类型，获取对象类型中的属性值
type Type1 = Props['a'] // Type1 => number
type Type2 = Props['b'] // Type2 => string
type Type3 = Props['c'] // Type3 => boolean

// 模拟 Partial 的实现
// '?' 表示属性是可选的
type MyPartial<T> = {
  [P in keyof T]?: T[P]
}

type PartialProps = MyPartial<Props>

export {}
