// 1. 参数个数：参数少的可以赋值给参数多的
type F1 = (a: number) => void
type F2 = (a: number, b: number) => void

let f1: F1 = (a) => {}
let f2: F2 = (a, b) => {}

// f1 = f2; // 参数多的不可以赋值给参数少的
f2 = f1; // 参数少的可以赋值给参数多的

