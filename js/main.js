var app = new Vue({
  el: '#app',
  data: {
    shellPS : '$',
    ps: '$',
    lines: [],
    dataStorage: {
      'token': '',
      'devices': {},
      'targetDevices': {},
    }
  }
});

var cmdCallback = handleCommand;

var output = {
  'println': function(msg, type) {
    app.lines.push({text: msg, type: type});
  },
  'log': function(msg) {
    output.println(msg, 'log');
  },
  'error': function(msg) {
    output.println(msg, 'error');
  },
  'warning': function(msg) {
    output.println(msg, 'warning');
  },
  'success': function(msg) {
    output.println(msg, 'success');
  }
}

window.onload = function() {
  document.getElementById('cmd').focus();
  document.getElementById('cmd').addEventListener('keypress', async function(evt) {
    if (evt.which === 13) {
      evt.preventDefault();

      var commandResult = document.getElementById('cmd').value;
      var command = document.getElementById('cmd').type == 'text' ? commandResult : '';
      document.getElementById('cmd').value = '';

      document.getElementById('prompt').style.display = 'none';

      output.println(app.ps + ' ' + command, 'command');

      cmdCallback(commandResult);
    }
  });
};

function showInput() {
  document.getElementById('prompt').style.display = 'block';
}
