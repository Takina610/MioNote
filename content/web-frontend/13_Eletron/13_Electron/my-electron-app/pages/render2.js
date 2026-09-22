const content2 = document.getElementById('content2')

function receive(e, m) {
  content2.innerText += m
}

talkToRenderProcess.receiveMessage(receive)
