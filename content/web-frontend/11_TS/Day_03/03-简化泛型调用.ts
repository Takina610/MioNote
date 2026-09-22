function id<Type>(value: Type): Type {
  return value
}

// 简化泛型调用，ts会自动推断出泛型的类型
// 但此时 ts推断出的类型是字面量类型
const num = id(123)
const str = id('hello')

console.log(num)
console.log(str)

export {}
