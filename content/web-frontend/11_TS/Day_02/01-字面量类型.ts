let str1 = 'Hello TS'

// * 不难发现，str2被认为是 'Hello TS'类型
// * 此处的 'Hello TS'就是一个字面量类型
// * 也就是说某个特定的字符串也可以作为 TS 中的类型
const str2 = 'Hello TS'

const str3: 'Hello TS' = 'Hello TS'
let age: 18 = 18


function changeDirection(direction: 'up' | 'down' | 'left' | 'right') {
  console.log(direction)
}
changeDirection('up')

export {}