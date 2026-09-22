interface Props {
  id: string
  name: string
}

type ReadonlyProps = Readonly<Props>

let p1: ReadonlyProps = {
  id: '1',
  name: '2'
}

// 报错，因为 Readonly工具类型将所有属性变为只读
// p1.id = '3'

export {}
