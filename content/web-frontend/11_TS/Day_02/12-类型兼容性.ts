// 演示类型兼容性
let arr = ['a', 'b', 'c']

arr.forEach((item) => {})
arr.forEach((item, index) => {})
arr.forEach((item, index, array) => {})

// 两个类的兼容性
class Point {x: number; y: number}

class Point2D {x: number; y: number}

class Point3D {x: number; y: number; z: number}

// TS采用的是结构化类型系统，只要两个类型具有相同的结构，就可以进行兼容
let p: Point = new Point2D()

// 如果y的成员至少与x的成员相同，那么y就与x兼容
let p2: Point = new Point3D()

// 错误演示
// let p3: Point3D = new Point()
export {}
