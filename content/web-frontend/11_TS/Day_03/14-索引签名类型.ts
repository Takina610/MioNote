// 索引签名类型，可以为对象类型添加任意数量的属性
interface AnyObject {
  // key可以为任意，只是个占位符
  [key: string]: number
}

const obj: AnyObject = {
  a: 1,
  b: 2
}

interface MyArray<Type> {
  [item: number]: Type
}

const arr: MyArray<number> = [1, 2, 3]

export {}
