interface Length {
  length: number
}

function id<Type extends Length>(value: Type): Type {
  console.log(value.length)
  return value
}

// 必须传递一个具有 length 属性的对象
id([1, 2, 3])
id('string')

export {}
