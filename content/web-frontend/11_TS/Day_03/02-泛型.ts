// 泛型，可以定义一个函数，这个函数可以接受一个参数，这个参数的类型是泛型
function id<Type>(value: Type): Type {
  return value
}

const num = id<number>(123)
const str = id<string>('hello')

console.log(num)
console.log(str)

export {}

