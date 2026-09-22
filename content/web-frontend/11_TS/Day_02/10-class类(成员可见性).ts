class Animal {
  // 私有成员
  private name: string = "animal"
  // 受保护成员
  protected age: number = 18
  // 公有成员
  public move() {

    this.name = "dog"
    this.age = 20 // 受保护成员可以在类内部访问
    console.log("move")
  }
}

const animal = new Animal()
animal.move()

class Dog extends Animal {
  // 默认是 public
  bark() {
    console.log("bark")
  }
}

const dog = new Dog()
// dog.name => 错误，因为 name 是私有成员
// dog.age => 错误，因为 age 是受保护成员，不能在类外部访问
dog.move()
dog.bark()
