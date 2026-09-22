console.log('preload')

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('talkToRenderProcess', {
  talk: "hello from preload",
  saveFile: (data) => {
    ipcRenderer.send('save-file', data)
  },
  readFile() {
    return ipcRenderer.invoke('read-file')
  },
  getMessage(callBack) {
    ipcRenderer.on('message', callBack)
  },
  sendMessage: (message) => {
    ipcRenderer.send('send-message', message)
  },
  receiveMessage: (message) => {
    ipcRenderer.on('receive-message', message)
  }
})