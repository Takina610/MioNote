interface IPerson{
  name: string;
  age: number;
  sayHi(): void;
}

type IPersonType = {
  name: string;
  age: number;
  sayHi(): void;
}

// 接口 只能为对象类型命名
// 类型别名 可以为任意类型命名