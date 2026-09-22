/**
 * 目标1：完成省市区下拉列表切换
 *  1.1 设置省份下拉菜单数据
 *  1.2 切换省份，设置城市下拉菜单数据，清空地区下拉菜单
 *  1.3 切换城市，设置地区下拉菜单数据
 */

// 1.1 设置省份下拉菜单数据
axios({
  url: 'http://hmajax.itheima.net/api/province',
}).then(result => {
  const optionStr = result.data.list.map(pname => `<option value="${pname}">${pname}</option>`).join('')

  document.querySelector('.province').innerHTML = ` <option value="">省份</option>` + optionStr
})

// 1.2 切换省份，设置城市下拉菜单数据，清空地区下拉菜单
document.querySelector('.province').addEventListener('change', async event => {
  const result = await axios({url: 'http://hmajax.itheima.net/api/city', params: {pname: event.target.value}})

  const optionStr = result.data.list.map(cname => `<option value="${cname}">${cname}</option>`).join('')

  document.querySelector('.city').innerHTML = `<option value="">城市</option>` + optionStr

  // 清空地区数据
  document.querySelector('.area').innerHTML = `<option value="">地区</option>`
})

// 1.3 切换城市，设置地区下拉菜单数据
document.querySelector('.city').addEventListener('change', async event => {
  const result = await axios({url: 'http://hmajax.itheima.net/api/area', params: {
    pname: document.querySelector('.province').value,
    cname: event.target.value
  }})
  const optionStr = result.data.list.map(aname => ` <option value="${aname}">${aname}</option>`).join('')
  document.querySelector('.area').innerHTML = ` <option value="">地区</option>` + optionStr
})
