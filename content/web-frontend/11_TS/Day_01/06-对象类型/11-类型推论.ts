// 当没有明确指定类型时，TypeScript 会推断出一个类型，这就是类型推论。
// 只有给了初始值才会推断出类型，如果没有初始值，那么就是 any类型
let age = 18

// 因为 ts已经推断出 age是 number类型，所以不能再赋值其他类型
// age = '18'

// 函数的返回值类型也是根据返回值推断出来的
function add1(a: number, b: number) {
  return a + b
}
const add2 = (a: number, b: number) => a + b


export {}