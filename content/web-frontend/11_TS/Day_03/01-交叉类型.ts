interface Person {
  name: string
  age: number
}

interface Contact {
  phone: string
  email: string
}

// 交叉类型，将两个类型合并为一个类型，合并后的类型，将拥有两个类型的所有属性
type PersonContact = Person & Contact

const personContact: PersonContact = {
  name: 'John',
  age: 30,
  phone: '1234567890',
  email: 'john@example.com'
}
