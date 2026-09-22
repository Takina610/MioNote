// 富文本编辑器
// 创建编辑器函数，创建工具栏函数
const { createEditor, createToolbar } = window.wangEditor

const editorConfig = {
    placeholder: '这里开始...',
    onChange(editor) {
      const html = editor.getHtml()
      // console.log('editor content', html)
      // 也可以同步到 <textarea>
      // 为了后续快速同步 textarea的内容作铺垫
      document.querySelector('.publish-content').innerHTML = html
    }
}

const editor = createEditor({
  // 创建位置
    selector: '#editor-container',
    // 默认内容
    html: '<p><br></p>',
    config: editorConfig,
    mode: 'default', // or 'simple'
})

// 工具栏配置对象
const toolbarConfig = {}

// 创建工具栏
const toolbar = createToolbar({
    // 为指定编辑器创建工具栏
    editor,
    // 工具栏创建的位置
    selector: '#toolbar-container',
    config: toolbarConfig,
    mode: 'default', // or 'simple'
})