type Props = { a: number; b: string; c: boolean }

// 其他使用方式
type Type1 = Props['a' | 'b'] // Type1 => { a: number; b: string }
type Type2 = Props['a' | 'c'] // Type2 => { a: number; c: boolean }
type Type3 = Props['a' | 'b' | 'c'] // Type3 => { a: number; b: string; c: boolean }
type Type4 = Props[keyof Props] // Type4 => { a: number; b: string; c: boolean }

export {}
