console.log('render')

const btn = document.getElementById('btn1')

btn.onclick = () => {
  alert(talkToRenderProcess.talk)
  console.log(window)
  console.log(talkToRenderProcess)
}

const btn2 = document.getElementById('btn2')
const input = document.getElementById('ipt')

btn2.onclick = () => {
  console.log(input.value)
  talkToRenderProcess.saveFile(input.value)
}

const btn3 = document.getElementById('btn3')
const content = document.getElementById('content')

btn3.onclick = async () => {
  const data = await talkToRenderProcess.readFile()
  content.innerText = data
}

function callBack(event, message) {
  console.log(event, message)
}

window.onload = () => {
  talkToRenderProcess.getMessage(callBack)
}

const ipt2 = document.getElementById('ipt2')
const btn4 = document.getElementById('btn4')

btn4.onclick = () => {
  talkToRenderProcess.sendMessage(ipt2.value)
}