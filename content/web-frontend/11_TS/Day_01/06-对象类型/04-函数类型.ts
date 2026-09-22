// 在函数名称后面使用冒号指定函数的返回值类型
function add1(x: number, y: number): number {
    return x + y
}

const add2 = (x: number, y: number): number => x + y

// 同时指定函数的参数类型和返回值类型
const add3: (x: number, y: number) => number = (x, y) => x + y
// (x: number, y: number) => number
// const add3 = (x, y) => x + y

function greet(name: string): void {
  console.log('Hello, ' + name)
}
greet('Kobe')

// 可选参数只能出现在参数列表的最后，也就是说可选参数后面不能再次出现必选参数
function mySlice(start?: number, end?: number): void {
  console.log('起始索引:', start, '结束索引:', end)
}

mySlice()
mySlice(1)
mySlice(1, 3)
