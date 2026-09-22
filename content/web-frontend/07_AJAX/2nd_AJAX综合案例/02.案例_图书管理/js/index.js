/**
 * 目标1：渲染图书列表
 *  1.1 获取数据
 *  1.2 渲染数据
 */
const creator = 'LJH'
// 获取并渲染图书列表函数
function renderBookList() {
  // 获取数据
  axios({
    url: 'http://hmajax.itheima.net/api/books',
    params: {
      creator
    }
  }).then(result => {
      // console.log(result)
      console.log(result.data.data)
      const bookList = result.data.data
      
      const bookStr = bookList.map((item, index) => {
        const {id, bookname, author, publisher} = item
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${bookname}</td>
            <td>${author}</td>
            <td>${publisher}</td>
            <td data-id="${id}">
              <span class="del">删除</span>
              <span class="edit">编辑</span>
            </td>
        </tr>
        `
      }).join('')
      document.querySelector('.list').innerHTML = bookStr
  })

}

renderBookList()

/**
 * 目标 2：新增图书
 * 2.1 新增弹框 -> 显示和隐藏
 * 2.2 收集表单数据，并提交到服务器上保存
 * 2.3 刷新图书列表
 */

// 创建弹框对象
const addModalDom = document.querySelector('.add-modal')
const addModal = new bootstrap.Modal(addModalDom)

// 给保存按钮点击事件
document.querySelector('.add-btn').addEventListener('click', () => {
  // 收集表单数据，并提交到服务器上保存
  const addForm = document.querySelector('.add-form')
  const bookObj = serialize(addForm, {hash: true, empty: true})
  axios({
    url: 'http://hmajax.itheima.net/api/books',
    method: 'POST',
    data: {
      ...bookObj,
      creator
    }
  }).then(result => {
    renderBookList()

    // 重置表单
    addForm.reset()

    addModal.hide()
  })
})

/**
 * 目标 3：删除图书
 * 3.1 删除元素绑定点击事件 -> 获取图书 id
 * 3.2 调用删除按钮
 * 3.3 刷新图书列表
 */

// 删除元素 -> 事件委托
document.querySelector('.list').addEventListener('click', event => {
  // 判断点击的是否是删除
  if (event.target.classList.contains('del')) {
    // 获取图书 id（自定义属性）
    const bookId = event.target.parentNode.dataset.id
    // 调用删除接口
    axios({
      url: `http://hmajax.itheima.net/api/books/${bookId}`,
      method: 'DELETE'
    }).then(() => {
      // 刷新图书列表
      renderBookList()
    })
  }
})

/**
 * 目标 4：编辑图书
 * 4.1 编辑弹框 -> 显示和隐藏
 * 4.2 获取当前图书编辑数据
 * 4.3 提交保存修改，并刷新列表
 */

// 创建弹框对象
const editModalDom = document.querySelector('.edit-modal')
const editModal = new bootstrap.Modal(editModalDom)

// 事件委托
document.querySelector('.list').addEventListener('click', event => {
  if (event.target.classList.contains('edit')) {
    const bookId = event.target.parentNode.dataset.id
    axios({
      url: `http://hmajax.itheima.net/api/books/${bookId}`
    }).then(result => {
      const bookObj = result.data.data
      const {id, bookname, author, publisher} = bookObj
      // 数据对象的属性和标签的类名一致
      // 遍历数据对象，使用属性去获取对应的标签，快速赋值
      const bookData = Object.keys(bookObj)
      bookData.forEach(key => {
        document.querySelector(`.edit-form .${key}`).value = bookObj[key]
      })
    })
    editModal.show()
  }
})

// 修改按钮
document.querySelector('.edit-btn').addEventListener('click', () => {
  // 保存修改
  const editForm = document.querySelector('.edit-form')
  const {id, bookname, author, publisher} = serialize(editForm, {hash: true, empty: true})
  // 隐藏的输入框，用于获取图书 id，但用户没有必要看见
  // <input type="hidden" class="id" name="id">
  axios({
    url: `http://hmajax.itheima.net/api/books/${id}`,
    method: 'PUT',
    data: {
      bookname,
      author,
      publisher,
      creator
    }
  }).then(result => {
    // 重新获取并刷新列表
    renderBookList()
  })
  editModal.hide()
})

