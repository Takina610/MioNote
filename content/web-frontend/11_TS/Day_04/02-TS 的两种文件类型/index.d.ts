// 类型声明 (declaration) 文件

type props = {
  name: string
}

// 报错，在 .d.ts文件中，只能声明类型，不能包含代码实现
// const a: props = {
//   name: '123'
// }
