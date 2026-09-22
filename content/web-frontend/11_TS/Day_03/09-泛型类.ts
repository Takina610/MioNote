class GenericNumber<NumberType> {
  defaultValue: NumberType
  constructor(defaultValue: NumberType) {
    this.defaultValue = defaultValue
  }
  func: (x: NumberType, y: NumberType) => NumberType
}

const num = new GenericNumber<number>(123)
num.func(1, 2)

// 有了构造方法后，可以不指定类型
const str = new GenericNumber('123')
str.func('1', '2')

export {}
