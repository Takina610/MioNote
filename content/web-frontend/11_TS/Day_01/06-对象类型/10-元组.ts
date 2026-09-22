// 元组类型是另一种数组，它确切地知道包含多少个元素，以及特定索引对应的类型
// 少一个多一个都不行
let position: [number, number] = [39.9, 116.4]
// let position: [number, string] = [39.9, '116.4']

console.log(position[0], position[1])
