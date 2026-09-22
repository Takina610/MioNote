function getProp<Type, Key extends keyof Type>(obj: Type, key: Key): Type[Key] {
  return obj[key]
}

let person = { name: '张三', age: 18 }
console.log(getProp(person, 'name'))
console.log(getProp(person, 'age'))

// 传递一个不存在的属性 => 报错
// console.log(getProp(person, 'gender'))

// number类型中的 toFixed 等方法或者 length等属性
console.log(getProp(18, 'toFixed'))
console.log(getProp('str', 'length'))

export {}
