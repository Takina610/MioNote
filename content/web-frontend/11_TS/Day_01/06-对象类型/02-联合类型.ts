let arr1: (number | string)[] = [1, '2', 3]

// let arr2: Array<number | string> = [1, '2', 3] 了解即可

let arr3: (number | string | boolean)[] = [1, '2', 3, true]

// 不加 小括号表示的是 数组的元素类型可以是 number 也可以是 string[] 类型，但不能同时存在
let arr4: number | string[] = 123
arr4 = ['123']