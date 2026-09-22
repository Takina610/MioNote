interface Point {x: number; y: number}
interface Point2D {x: number; y: number}
interface Point3D {x: number; y: number; z: number}

let p1: Point
let p2: Point2D
let p3: Point3D

// 正确
p1 = p2
p1 = p3
p2 = p3

// 错误演示
// p3 = p1

// 类和接口也是可以兼容的
class Point4D {x: number; y: number; z: number; w: number}
p1 = new Point4D()
p2 = new Point4D()
p3 = new Point4D()

export {}