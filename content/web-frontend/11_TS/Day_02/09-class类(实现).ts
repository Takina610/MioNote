interface Person {
  name: string
  age: number
  sayHello(): void
}

class Student implements Person {
  name: string = '张三'
  age: number = 18
  sayHello(): void {
    console.log('Hello, world!')
  }
}

const s = new Student()
s.sayHello()

export {}
