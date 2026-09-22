/**
 * 目标 1.体验 webpack打包过程
 *  1.1 准备源代码和项目
 *  1.2 准备 webpack打包的环境（npm i webpack webpack-cil --save-dev）
 *  1.3 运行自定义命令打包观察效果（npm run 自定义命令）
 */
// 1.1 准备源代码和项目
import { checkPhone, checkCode } from '../utils/check.js'
// console.log(checkPhone('13800138000'))
// console.log(checkCode('111111111'))

/**
 * 目标 2.修改 webpack打包出口和入口
 *  2.1 项目根目录，新建 webpack.config.js配置文件
 *  2.2 导出配置对象，配置入口，出口文件路径
 *  2.3 重新打包观察
 */


/**
 * 目标 3.用户登录-长度判断案例
 *  3.1 准备用户登录页面
 *  3.2 编写核心 JS逻辑代码
 *  3.3 打包并手动复制 html文件到 dist目录下，引入打包后的 js文件，运行
 */
// 3.2 编写核心 JS逻辑代码
document.querySelector('.btn').addEventListener('click', () => {
  const phone = document.querySelector('.login-form [name=mobile]').value
  const code = document.querySelector('.login-form [name=code]').value

  if (!checkPhone(phone)) {
    alert('手机号长度必须为11位')
    return
  }

  if (!checkCode(code)) {
    alert('验证码长度必须为6位')
    return
  }

  alert('提交到服务器登录...')
})


/**
 * 目标 4.使用 html-webpack-plugin插件自动生成 html网页文件，并引入打包后的其他资源
 *  4.1 下载 html-webpack-plugin本地软件包（ npm i --save-dev html-webpack-plugin）
 *  4.2 配置 webpack.config.js让 Webpack拥有插件功能
 *  4.3 重新打包观察
 */


/**
 * 目标 5.打包 CSS代码
 *  5.1 准备 css代码，并引入到 js中
 *  5.2 下载 css-loader和 style-loader本地软件包（npm install --save-dev css-loader）（npm install style-loader --save-dev）
 *  5.3 配置 webpack.config.js和 Webpack拥有该加载器功能
 *  5.4 打包后观察效果
 */
// 5.1 准备 css代码，并引入到 js中
import 'bootstrap/dist/css/bootstrap.min.css' // (引入 bootstrap)
import './index.css'


/**
 * 目标 6.优化-提取 css代码到单独的 css文件中
 *  6.1 下载 mini-css-extract-plugin本地软件包（npm install --save-dev mini-css-extract-plugin）
 *  6.2 配置 webpack.config.js让 Webpack拥有插件功能
 *  6.3 打包后观察效果
 */


/**
 * 目标 7.优化-压缩 css代码
 *  7.1 下载 css-minimizer-webpack-plugin本地软件包（npm install css-minimizer-webpack-plugin --save-dev）
 *  7.2 配置 webpack.config.js让 Webpack拥有该插件功能
 *  7.3 打包后观察效果
 */


/**
 * 目标 8.打包 less代码
 *  8.1 新建 less代码（设置背景图）并引入到 src/login/index.js中
 *  8.2 下载 less和 less-loader本地软件包（npm install less less-loader --save-dev）
 *  8.3 配置 webpack.config.js让 Webpack拥有功能
 *  8.4 打包后观察效果
 */
// 8.1 新建 less代码（设置背景图）并引入到 src/login/index.js中
import './index.less'


/**
 * 目标 9.打包资源模块（图片处理）
 *  9.1 创建 img标签并动态添加到页面，配置 webpack.config.js
 *  9.2 打包后观察效果和区别
 */
// 9.1 创建 img标签并动态添加到页面，配置 webpack.config.js
import imageSrc from './assets/logo.png'

const img = document.createElement('img')
img.src = imageSrc
document.querySelector('.login-wrap').appendChild(img)
