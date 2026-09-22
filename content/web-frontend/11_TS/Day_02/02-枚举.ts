// 枚举
enum Direction {
  Up,
  Down,
  Left,
  Right
}
function changeDirection(direction: Direction) {
  console.log(direction)
}
changeDirection(Direction.Up) // 0
changeDirection(Direction.Down) // 1

// 也可以给枚举成员初始化值
enum Direction2 { // 数字枚举
  Up = 1,
  Down, // 2
  Left = 6,
  Right // 7
}

// 必须为每个枚举成员提供初始化值
enum Direction3 { // 字符串枚举
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT'
}

export {}