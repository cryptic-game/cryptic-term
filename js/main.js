const app = new Vue({
  el: '#app',
  data: {
    ps: '$',
    lines: [],
    dataStorage: {
      'token': '',
      'devices': {},
      'targetDevices': {}
    }
  }
})

window.onload = terminal.init
