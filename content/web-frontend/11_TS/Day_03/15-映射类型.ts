type PropKeys = 'id' | 'name' | 'age'

// 映射类型，将一个类型中的所有属性映射到另一个类型中
// 只能在 type 中使用，不能在 interface 中使用
type Props = {
  [key in PropKeys]: string
}

const obj: Props = {
  id: '1',
  name: '2',
  age: '3'
}
