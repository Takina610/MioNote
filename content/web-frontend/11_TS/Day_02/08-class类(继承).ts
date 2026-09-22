class Animal {
  move() {
    console.log('动物在移动')
  }
}

class Dog extends Animal {
  name: string = '旺财'
  bark() {
    console.log('狗在叫')
  }
}

const d = new Dog()
d.bark()
d.move()

export {}

