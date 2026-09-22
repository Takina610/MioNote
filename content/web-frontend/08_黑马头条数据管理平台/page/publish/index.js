/**
 * 目标1：设置频道下拉菜单
 *  1.1 获取频道列表数据
 *  1.2 展示到下拉菜单中
 */
// 代码需复用，封装函数
// 1.1 获取频道列表数据
async function getChannelList() {
  const ret = await axios({
    url: '/v1_0/channels'
  })
  const channelList = `<option value="" selected="">请选择文章频道</option>` + ret.data.channels.map(item => `<option value="${item.id}">${item.name}</option>`).join('')
  document.querySelector('.form-select').innerHTML = channelList
}
// 网页运行后，默认调用一次
getChannelList()

/**
 * 目标2：文章封面设置
 *  2.1 准备标签结构和样式
 *  2.2 选择文件并保存在 FormData
 *  2.3 单独上传图片并得到图片 URL 网址
 *  2.4 回显并切换 img 标签展示（隐藏 + 号上传标签）
 */

// 2.2 选择文件并保存在 FormData
document.querySelector('.img-file').addEventListener('change', async event => {
  const file = event.target.files[0]
  const fd = new FormData()
  fd.append('image', file)
  // 2.3 单独上传图片并得到图片 URL 网址
  const res = await axios({
    url: '/v1_0/upload',
    method: 'POST',
    data: fd
  })
  // 2.4 回显并切换 img 标签展示（隐藏 + 号上传标签）
  const imgUrl = res.data.url
  document.querySelector('.rounded').src = imgUrl
  document.querySelector('.rounded').classList.add('show')
  document.querySelector('.place').classList.add('hide')
})

// 点击 img可以重新切换图片
// img点击 => 用 JS的方式触发文件选择元素的 click事件方法
// document.querySelector('.rounded').addEventListener('click', () => {
//   document.querySelector('.img-file').click()
// })

/**
 * 目标3：发布文章保存
 *  3.1 基于 form-serialize 插件收集表单数据对象
 *  3.2 基于 axios 提交到服务器保存
 *  3.3 调用 Alert 警告框反馈结果给用户
 *  3.4 重置表单并跳转到列表页
 */
document.querySelector('.send').addEventListener('click', async event => {
  if(event.target.innerHTML !== '发布') return
  const form = document.querySelector('.art-form')
  // 3.1 基于 form-serialize 插件收集表单数据对象
  const data = serialize(form, {hash: true, empty: true})
  // 发布文章时，不需要 data里的 id属性
  delete data.id
  // 收集封面图片的地址，保存到 data对象里
  data.cover = {
    type: 1, // 封面类型
    images: [document.querySelector('.rounded').src] // 封面的 URL
  }
  // 3.2 基于 axios 提交到服务器保存
  // 3.3 调用 Alert 警告框反馈结果给用户
  try {
      const res = await axios({
      url: '/v1_0/mp/articles',
      method: 'POST',
      data: data
    })
    myAlert(true, "文章发布成功")
    // 3.4 重置表单并跳转到列表页
    form.reset()
    // 图片内容和富文本编辑器内容需手动清空
    document.querySelector('.rounded').src = ''
    document.querySelector('.rounded').classList.add('show')
    document.querySelector('.place').classList.add('hide')
    editor.setHtml('')

    setTimeout(() => {
      location.href = '../content/index.html'
    }, 1500);
  } catch(error) {
    myAlert(false, error.response.data.message)
  }
  
  
})

/**
 * 目标4：编辑-回显文章
 *  4.1 页面跳转传参（URL 查询参数方式）
 *  4.2 发布文章页面接收参数判断（共用同一套表单）
 *  4.3 修改标题和按钮文字
 *  4.4 获取文章详情数据并回显表单
 */
// 4.2 发布文章页面接收参数判断（共用同一套表单）
;(function(){
  // 4.2 发布文章页面接收参数判断（共用同一套表单）
  const paramsStr = location.search
  const params = new URLSearchParams(paramsStr)
  params.forEach(async (value, key) => {
    // 当前有编辑的文章 id被传入过来
    if (key === 'id') {
      // 4.3 修改标题和按钮文字
      document.querySelector('.title').innerHTML = '修改文章'
      document.querySelector('.send').innerHTML = '修改'
      // 4.4 获取文章详情数据并回显表单
      const res = await axios({
        url: `/v1_0/mp/articles/${value}`
      })
      // 组织我仅仅需要的数据对象，为后续遍历作铺垫
      const dataObj = {
        channel_id: res.data.channel_id,
        title: res.data.title,
        rounded: res.data.cover.images[0], // 封面图片地址
        content: res.data.content,
        id: res.data.id
      }
      // 遍历数据对象属性，映射到页面元素上，快速赋值
      Object.keys(dataObj).forEach(key => {
        if (key === 'rounded') {
          // 判断有无图片
          if (dataObj[key]) {
            document.querySelector('.rounded').src = dataObj[key]
            document.querySelector('.rounded').classList.add('show')
            document.querySelector('.place').classList.add('hide')
          }
        } else if (key === 'content') {
          // 富文本内容
          editor.setHtml(dataObj[key])
        } else {
          // 用数据对象属性名，作为标签 name属性选择器来找到
          document.querySelector(`[name=${key}]`).value = dataObj[key]
        }
      })
    }
  })
})();

/**
 * 目标5：编辑-保存文章
 *  5.1 判断按钮文字，区分业务（因为共用一套表单）
 *  5.2 调用编辑文章接口，保存信息到服务器
 *  5.3 基于 Alert 反馈结果消息给用户
 */
document.querySelector('.send').addEventListener('click', async event => {
  // 5.1 判断按钮文字，区分业务（因为共用一套表单）
  if(event.target.innerHTML !== '修改') return
  // 修改文章逻辑
  const form = document.querySelector('.art-form')
  const data = serialize(form, {hash: true, empty: true})

  try {
      // 5.2 调用编辑文章接口，保存信息到服务器
      const res = await axios({
        url: `/v1_0/mp/articles/${data.id}`,
        method: 'PUT',
        data: {
          ...data,
          cover: {
            type: document.querySelector('.rounded').src ? 1 : 0, // 封面类型
            images: [document.querySelector('.rounded').src] // 封面的 URL
          }
        }
      })
      // 5.3 基于 Alert 反馈结果消息给用户
      myAlert(true, "文章修改成功")
      setTimeout(() => {
        location.href = '../content/index.html'
      }, 1500);
  } catch (error) {
    myAlert(false, error.response.data.message)
  }
  
})