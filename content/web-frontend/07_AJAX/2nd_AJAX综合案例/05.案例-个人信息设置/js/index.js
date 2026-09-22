/**
 * 目标1：信息渲染
 *  1.1 获取用户的数据
 *  1.2 回显数据到标签上
 * */
const creator = 'Lu Jiahao'

function render() {
  axios({
    url: 'http://hmajax.itheima.net/api/settings',
    params: {
      creator
    }
  }).then(result => {
    const userObj = result.data.data
    Object.keys(userObj).forEach(key => {
      if (key === 'avatar') {
        // 赋予默认头像
        document.querySelector('.prew').src = userObj[key]
      } else if (key === 'gender') {
        // 赋予默认性别
        // 获取两个单选框 [男单选，女单选]
        const genderList = document.querySelectorAll('.gender')
        // 男 radio的 value值为 0，女 radio的 value值为 1
        // 将获取的 gender属性的值作为数组的索引号对应
        genderList[userObj[key]].checked = true
      } else {
        // 赋予默认内容
        document.querySelector(`.${key}`).value = userObj[key]
      }
    })
  })
}
render()

/**
 * 目标2：获取头像
 *  2.1 获取头像文件
 *  2.2 提交到服务器并且更新头像
 * */

// 文件选择元素 -> change事件
document.querySelector('.upload').addEventListener('change', event => {
  const FD = new FormData()
  FD.append('avatar', event.target.files[0])
  FD.append('creator', creator)
  // 2.2 提交到服务器并且更新头像
  axios({
    url: 'http://hmajax.itheima.net/api/avatar',
    method: 'PUT',
    data: FD
  }).then(result => {
    render()
  })
})


/**
 * 目标3：提交表单
 *  3.1 获取表单信息
 *  3.2 提交到服务器并且更新
 * */
document.querySelector('.submit').addEventListener('click', event => {
  // 收集表单信息
  const userObj = serialize(document.querySelector('.user-form'), {hash: true, empty: true})
  userObj.creator = creator
  // 性别数字字符串转换为数字
  userObj.gender = +userObj.gender
  // 提交到服务器
  axios({
    url: 'http://hmajax.itheima.net/api/settings',
    method: 'PUT',
    data: userObj
  }).then(result => {
    const toastDom = document.querySelector('.my-toast')
    const toast = new bootstrap.Toast(toastDom)
    toast.show()
    render()
  })
})