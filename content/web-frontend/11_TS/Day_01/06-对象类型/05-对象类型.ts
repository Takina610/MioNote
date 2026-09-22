// 在声明对象参数时，使用逗号、分号都可以
let person: {
  name: string;
  age: number;
  // sayHi(): void;
  sayHi: () => void;
  greet(name: string): void;
} = {
  name: 'Tom',
  age: 25,
  sayHi() {
    console.log('Hi')
  },
  greet(name: string) {
    console.log(`Hello ${name}`)
  }
}

console.log(person.sayHi())
console.log(person.greet('Jerry'))