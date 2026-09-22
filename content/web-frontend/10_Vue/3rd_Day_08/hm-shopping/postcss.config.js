module.exports = {
  plugins: {
    'postcss-px-to-viewport': {
      // vw适配的标准屏的宽度 （iPhoneX）
      // 设计图 750，调成 1倍 => 适配375标准屏幕
      // 设计图 640，调成一倍 => 适配320标准屏幕
      viewportWidth: 375
    }
  }
}
