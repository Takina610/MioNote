interface Point2D {x: number; y: number}
interface Point3D {x: number; y: number; z: number}

type F2 = (a: Point2D) => void
type F3 = (a: Point3D) => void

let f2: F2
let f3: F3

// f2 = f3 // 参数多的不可以赋值给参数少的
f3 = f2 // 参数少的可以赋值给参数多的

export {}
