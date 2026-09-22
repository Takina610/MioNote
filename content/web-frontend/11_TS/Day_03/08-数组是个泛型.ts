// 悬浮到 forEach 方法上，可以看到 Array<string>
const str = ['a', 'b', 'c']
str.forEach((item) => {})

// 悬浮到 forEach 方法上，可以看到 Array<string | number | boolean>
const mix = [1, 'a', true]
mix.forEach((item) => {})

export {}

