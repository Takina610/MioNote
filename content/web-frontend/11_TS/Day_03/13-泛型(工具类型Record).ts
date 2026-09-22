// Record<Keys, Type>
// Record工具类型构造一个对象类型，属性键为 Keys，属性的类型为Type
type RecordProps = Record<'a' | 'b' | 'c', string[]>

const obj: RecordProps = {
  a: ['1', '2', '3'],
  b: ['4', '5', '6'],
  c: ['7', '8', '9']
}

export {}
