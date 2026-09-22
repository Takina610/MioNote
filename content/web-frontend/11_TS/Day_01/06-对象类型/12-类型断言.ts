const aLink1 = document.getElementById('link')
// 由于没有指定类型，TS通过推断机制推出 aLink1的类型为HTMLElement，但是该类型比较宽泛，只有公共标签的属性和方法，没有 a标签的属性和方法
// 所以不能直接使用 aLink1.href
// aLink1.herf

const aLink2 = document.getElementById('link') as HTMLAnchorElement

console.dir(aLink2.href)

// 了解即可
// const aLink3 = <HTMLAnchorElement>document.getElementById('link')
