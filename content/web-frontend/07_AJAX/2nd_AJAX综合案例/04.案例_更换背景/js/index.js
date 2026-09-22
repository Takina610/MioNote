/**
 * 目标：网站-更换背景
 *  1. 选择图片上传，设置body背景
 *  2. 上传成功时，"保存"图片url网址
 *  3. 网页运行后，"获取"url网址使用
 * */

document.querySelector('.bg-ipt').addEventListener('change', event => {
  const FD = new FormData()
  FD.append('img', event.target.files[0])
  axios({
    url: `http://hmajax.itheima.net/api/uploadimg`,
    method: 'POST',
    data: FD
  }).then(result => {
    const imgUrl = result.data.data.url
    document.querySelector('body').style.backgroundImage = `url(${imgUrl})`
    
    localStorage.setItem('bgImg', imgUrl)
  })
})

const bgUrl = localStorage.getItem('bgImg')

// 本地有背景图才设置
bgUrl && (document.querySelector('body').style.backgroundImage = `url(${bgUrl})`)
