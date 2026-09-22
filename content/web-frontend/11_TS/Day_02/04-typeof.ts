console.log(typeof 1) // number
console.log(typeof '1') // string
console.log(typeof true) // boolean
console.log(typeof undefined) // undefined
console.log(typeof null) // object
console.log(typeof []) // object
console.log(typeof {}) // object
console.log(typeof function () {}) // function

let p = {x: 1, y: 2}

function formatPoint (poiont: typeof p) {
  console.log(poiont)
}
formatPoint({x: 1, y: 100})

let num: typeof p.x // num为 number类型

export {}
