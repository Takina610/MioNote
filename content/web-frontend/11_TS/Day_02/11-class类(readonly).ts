class Person {
  // 只读属性只能用于修饰类的成员属性，不可以用来修饰成员方法等
  readonly name: string // 只读属性
  constructor(name: string) {
    this.name = name
  }

  test(): void {
    // this.name = 'Tom' // 报错
  }
}