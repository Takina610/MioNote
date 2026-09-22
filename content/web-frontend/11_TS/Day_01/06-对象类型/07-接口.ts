// 使用 interface来描述对象的类型，从而达到复用的目的
interface IPerson {
  name: string;
  age: number;
  sayHi(): void;
}

// 定义一个对象，对象的类型就是 IPerson
let person: IPerson = {
  name: '张三',
  age: 25,
  sayHi() {
    console.log('Hi')
  }
}
console.log(person)

export {}