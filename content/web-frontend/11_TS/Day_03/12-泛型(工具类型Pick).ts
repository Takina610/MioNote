interface Props {
  id: string
  name: string
  age: number
}

// Pick<Type, Keys>
// Pick工具类型从Type中选择一组属性来构造一个新类型
type PickProps = Pick<Props, 'id' | 'name'>

const obj: PickProps = {
  id: '1',
  name: '2'
}

export {}
