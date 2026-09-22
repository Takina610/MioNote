interface IdFunction<Type> {
  id: (value: Type) => Type
  ids: () => Type[]
}

let obj: IdFunction<number> = {
  id(value) {
    return value
  },
  ids() {
    return [1, 2, 3]
  }
}

obj.id(123)
obj.ids()

export {}


