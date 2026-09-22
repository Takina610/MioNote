type F1 = () => { name: string }
type F2 = () => { name: string; age: number }

let f1: F1
let f2: F2

f1 = f2 // 返回值多的可以赋值给返回值少的
// f2 = f1 // 返回值少的不可以赋值给返回值多的

export {}
