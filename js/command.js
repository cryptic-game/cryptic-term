var shellLevel = 0;
var loggedUUID = '';

/*
  0 -> LOGIN/REGISTER
  1 -> OVERVIEW
  2 -> DEVICE
*/

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getDeviceByName(name) {
  var result = null;

  Object.keys(app.dataStorage.devices).forEach(key => {
    var e = app.dataStorage.devices[key];
    if(e.name == name) {
      result = e;
    }
  });

  return result;
}

function getFileByName(name) {
  var result = null;

  Object.keys(app.dataStorage.devices[loggedUUID].files).forEach(key => {
    var e = app.dataStorage.devices[loggedUUID].files[key];
    if(e.filename == name) {
      result = e;
    }
  });

  return result;
}

var commands = {
  'clear': function(args) {
    app.lines = [];
    resetInput();
  },
  'login': function(args) {
    if(args.length == 1) {
      getInput('username >', function(username) {
        getPassword('password >', function(password) {
          api.user.login(username, password);
          resetInput();
        });
      });
    } else {
      output.warning('usage: login');
      resetInput();
    }
  },
  'register': function(args) {
    if(args.length == 1) {
      getInput('username >', function(username) {
        getInput('email >', function(email) {
          getPassword('password >', function(password) {
            getPassword('repeat password >', function(password2) {
              if(password === password2) {
                api.user.register(email, username, password);
                output.succes('created account -> please login');
              } else {
                output.error('passwords dont match!');
              }
              resetInput();
            });
          });
        });
      });
    } else {
      output.warning('usage: register');
      resetInput();
    }
  },
  'device': function(args) {
    if(shellLevel > 0) {
      if(args.length == 2 && args[1] == 'create') {
        output.log('creating new device...');
        api.device.create();
        output.success('use `device list` to show');
        resetInput();
      } else if(args.length == 2 && args[1] == 'list') {
        if(app.dataStorage.devices.length == 0) {
          output.warning('no device found');
        } else {
          Object.keys(app.dataStorage.devices).forEach(key => {
            d = app.dataStorage.devices[key];
            output.log(d.name);
          });
          resetInput();
        }
      } else {
        output.warning('usage: device <action>');
        output.log('actions: list | create');
        resetInput();
      }
    } else {
      output.error('You have to login!');
      resetInput();
    }
  },
  'boot': function(args) {
    if(shellLevel == 1) {
      if(args.length == 2) {
        var name = args[1];
        var device = getDeviceByName(name);
        if(device != null) {
          if(!device.powered_on) {
            api.device.toggle(device.uuid);
            output.success('booting ' + name);
          } else {
            output.warning('device is already online!');
          }
        }
      }
    }
    resetInput();
  },
  'connect': function(args) {
    if(args.length == 2) {
      var name = args[1];
      var device = getDeviceByName(name);
      if(device != null) {
        if(device.powered_on) {
          loggedUUID = device.uuid;

          app.shellPS = app.dataStorage.username + ' @ ' + name + ' $';
          app.ps = app.shellPS;

          shellLevel = 2;

          output.success('connected to ' + name);

          resetInput();
        } else {
          output.error(name + ' is offline!');
          resetInput();
        }
      } else {
        output.error('device not found');
        resetInput();
      }
    } else {
      output.warning('usage: connect <name>');
      resetInput();
    }
  },
  'hostname': function(args) {
    if(shellLevel == 2 && loggedUUID != '') {
      if(args.length == 1) {
        output.log(app.dataStorage.devices[loggedUUID].name);
      } else if(args.length == 2) {
        var name = args[1];

        api.device.changeName(loggedUUID, name);

        app.shellPS = app.dataStorage.username + ' @ ' + name + ' $';
        app.ps = app.shellPS;

        output.success('changed name to ' + name);
      } else {
        output.warning('usage: hostname [name]');
      }
    }
    resetInput();
  },
  'exit': function(args) {
    if(shellLevel == 0) {
      const remote = require('electron').remote;
      let w = remote.getCurrentWindow();
      w.close();
    } else if(shellLevel == 1) {
      shellLevel--;
      app.shellPS = '$';
      app.ps = app.shellPS;
      api.user.logout();
    } else if(shellLevel == 2) {
      shellLevel--;
      app.shellPS = app.dataStorage.username + ' $';
      app.ps = app.shellPS;
      loggedUUID = '';
    }
    resetInput();
  },
  'shutdown': function(args) {
    if(shellLevel == 2 && loggedUUID != '') {
      if(args.length == 1) {
        if(app.dataStorage.devices[loggedUUID] != null) {
          if(app.dataStorage.devices[loggedUUID].powered_on) {
            api.device.toggle(loggedUUID);
            output.success('shutdown ' + app.dataStorage.devices[loggedUUID].name);
            shellLevel--;
            app.shellPS = app.dataStorage.username + ' $';
            app.ps = app.shellPS;
          } else {
            output.warning('device is already offline?!');
          }
        }
      }
    }
    resetInput();
  },
  'ls': function(args) {
    if(shellLevel == 2 && loggedUUID != '') {
      var device = app.dataStorage.devices[loggedUUID];
      if(device != null) {
        var files = device.files;
        if(files != null) {
          Object.keys(files).forEach(key => {
            var file = files[key];
            output.log(file.filename);
          });
        }
      }
    }
    resetInput();
  },
  'cat': function(args) {
    if(shellLevel == 2 && loggedUUID != '') {
      if(args.length == 2) {
        var device = app.dataStorage.devices[loggedUUID];
        var file = getFileByName(args[1]);
        if(device != null) {
          if(file != null) {
            output.log(file.content);
          } else {
            output.error('file not found!');
          }
        }
      } else {
        output.warining('usage: cat <fileUUID>');
      }
    }
    resetInput();
  },
  'touch': function(args) {
    if(shellLevel == 2 && loggedUUID != '') {
      var device = app.dataStorage.devices[loggedUUID];
      if(device != null) {
        if(args.length == 2) {
          api.file.create(loggedUUID, args[1], '');
          output.success('created ' + args[1]);
        } else if(args.length > 2) {
          var content = '';
          for(var i = 2; i < args.length; i++) {
            content += args[i] + ' ';
          }
          content = content.substring(0, content.length - 1);

          api.file.create(loggedUUID, args[1], content);
          output.success('created ' + args[1]);
        }
      } else {
        output.warining('usage: touch <name> [content]');
      }
    }
    resetInput();
  },
  'rm': function(args) {
    if(shellLevel == 2 && loggedUUID != '') {
      if(args.length == 2) {
        var device = app.dataStorage.devices[loggedUUID];
        var file = getFileByName(args[1]);
        if(device != null) {
          if(file != null) {
            api.file.delete(loggedUUID, file.uuid);
          } else {
            output.error('file not found!');
          }
        }
      }
    }
    resetInput();
  },
  'cp': function(args) {
    if(shellLevel == 2 && loggedUUID != '') {
      if(args.length == 3) {
        var device = app.dataStorage.devices[loggedUUID];
        var src = getFileByName(args[1]);
        var dest = getFileByName(args[2]);
        if(device != null) {
          if(src != null && dest == null) {
            api.file.create(loggedUUID, args[2], src.content);
          } else {
            if(src == null) {
              output.error('source not found!');
            } else if(dest != null) {
              output.error('destination already exists!')
            }
          }
        }
      }
    }
    resetInput();
  },
  'morpcoin': function(args) {
    if(shellLevel == 2 && loggedUUID != '') {
      if(args.length == 2) {
        var device = app.dataStorage.devices[loggedUUID];
        var file = getFileByName(args[1]);
        if(device != null) {
          if(file != null) {
            var content = file.content.split('\n');
            if(content.length == 2 && content[0].length > 5 && content[1].length > 4) {
              var uuid = content[0].substring(5, content[0].length);
              var key = content[1].substring(4, content[1].length);
              api.currency.get(uuid, key, function(wallet) {
                output.log(wallet.amount + ' Morpcoin');
                resetInput();
              }, function() {
                output.error('No valid wallet!');
                resetInput();
              });
            } else {
              output.error('No valid wallet!');
              resetInput();
            }
          } else {
            output.error('file not found!');
            resetInput();
          }
        }
      } else {
        output.warning('usage: morpcoin <file>');
        resetInput();
      }
    }
  },
  'service': function(args) {
    if(shellLevel == 2 && loggedUUID != '') {
      if(args.length == 3) {
        if(args[1] == 'create') {
          var name = args[2];

          if(name == 'Hydra' || name == 'SSH' || name == 'Telnet') {
            api.service.create(loggedUUID, name);
          } else {
            output.error('You have to use Hydra/SSH/Telnet!');
          }
        }
      } else if(args.length == 5) {
        if(args[1] == 'bruteforce') {
          var serviceUUID = args[2];
          var targetDeviceUUID = args[3];
          var targetServiceUUID = args[4];

          api.service.hack(loggedUUID, serviceUUID, targetDeviceUUID, targetServiceUUID, function(result) {
            if(result['ok']) {
              if(result['access'] != null && result['time'] != null) {
                output.log('stoped bruteforce after ' + result['time'] + ' seconds!');
                if(result['access']) {
                  output.succes('You gained access on that device!');
                } else {
                  output.warning('Access denied!');
                }
              } else {
                output.log('started bruteforce...');
              }
            } else {
              output.error('Bruteforce not available!');
            }
          }, function() {
            output.error('Bruteforce not available!');
          });
        }
      }
    }
    resetInput();
  }
}

function handleCommand(command) {
  let args = command.trim().split(' ');
  let func = commands[args[0]];

  if(func != null) {
    func(args);
  } else {
    if(args[0] != '') {
      output.error('no command found');
    }
    resetInput();
  }
}

function getInput(ps, callback) {
  cmdCallback = function(result) {
    callback(result);
  }

  app.ps = ps;
  showInput();
}

function getPassword(ps, callback) {
  document.getElementById('cmd').type = 'password';
  getInput(ps, callback);
}

function resetInput() {
  document.getElementById('cmd').type = 'text';
  app.ps = app.shellPS;
  cmdCallback = handleCommand;
  showInput();
}

var api = {
  'user': {
    'login': function(username, password) {
      Vue.http.post('https://user.api.cryptic-game.net/auth', {
        "username": username,
        "password": password
      }).then(response => {
        app.dataStorage['token'] = response.body["token"];
        app.dataStorage['username'] = username;

        api.device.getAll();

        output.success('successfully logged in as ' + username)

        shellLevel = 1;
        app.shellPS = username + ' $';
        app.ps = app.shellPS;
      }, response => {
        output.error('username or password is wrong!');
      });
    },
    'register': function(email, username, password) {
      Vue.http.put('https://user.api.cryptic-game.net/auth', {
        "email": email,
        "username": username,
        "password": password
      }).then(response => {
        output.succes('created account -> please login');
      }, response => {
        output.error('account cant created!');
      });
    },
    'logout': function() {
      Vue.http.delete('https://user.api.cryptic-game.net/auth', '', { 'headers': {
        "Token": app.dataStorage['token']
      }}).then(response => {
        output.succes('successfully logged out!');
      });
    }
  },
  'device': {
    'getAll': function() {
      Vue.http.get('https://device.api.cryptic-game.net/device/private', { 'headers': {
        "Token": app.dataStorage['token']
      }}).then(response => {
        response.body['devices'].forEach(e => {
          e['files'] = {};
          e['services'] = {};
          app.dataStorage['devices'][e['uuid']] = e;

          api.file.getAll(e.uuid);
          api.service.getAll(e.uuid);
        });
      });
    },
    'create': function() {
      Vue.http.put('https://device.api.cryptic-game.net/device/private', '', { 'headers': {
        "Token": app.dataStorage['token']
      }}).then(response => {
        let device = response.body;

        device['files'] = {};
        device['services'] = {};

        app.dataStorage['devices'][device[device.uuid]] = device;
      });
    },
    'toggle': function(uuid) {
      Vue.http.post('https://device.api.cryptic-game.net/device/private/' + uuid, '', { 'headers': {
        "Token": app.dataStorage['token']
      }}).then(response => {
        let device = response.body;

        device['files'] = {};
        device['services'] = {};

        app.dataStorage['devices'][device.uuid] = device;
      });
    },
    'delete': function(uuid) {
      Vue.http.delete('https://device.api.cryptic-game.net/device/private/' + uuid, { 'headers': {
        "Token": app.dataStorage['token']
      }}).then(response => {
        if(response.body["success"]) {
          delete app.dataStorage['devices'][uuid];
        }
      });
    },
    'changeName': function(uuid, name) {
      Vue.http.put('https://device.api.cryptic-game.net/device/private/' + uuid, JSON.stringify({
        'name': name
      }), { 'headers': {
        "Token": app.dataStorage['token']
      }}).then(response => {
          var device = response.body;

          device['files'] = {};
          device['services'] = {};

          app.dataStorage['devices'][device['uuid']] = device;
      });
    },
    'getPublicDevice': function(uuid) {
      Vue.http.get('https://device.api.cryptic-game.net/device/public/' + uuid, { 'headers': {
        "Token": app.dataStorage['token']
      }}).then(response => {
          var device = response.body;

          device['files'] = {};
          device['services'] = {};

          app.dataStorage['targetDevices'][device['uuid']] = device;
        });
      }
  },
  'file': {
    'create': function(deviceUUID, filename, content) {
      Vue.http.put('https://device.api.cryptic-game.net/file/' + deviceUUID, JSON.stringify({
        'filename': filename,
        'content': content
      }), { 'headers': {
        "Token": app.dataStorage['token']
      }}).then(response => {
          var file = response.body;

          app.dataStorage['devices'][file['device']]['files'][file['uuid']] = file;
      });
    },
    'getAll': function(deviceUUID) {
      Vue.http.get('https://device.api.cryptic-game.net/file/' + deviceUUID, { 'headers': {
        "Token": app.dataStorage['token']
      }}).then(response => {
          var files = response.body['files'];

          files.forEach(file => {
            app.dataStorage['devices'][file['device']]['files'][file['uuid']] = file;
          });
      });
    },
    'delete': function(deviceUUID, fileUUID) {
      Vue.http.delete('https://device.api.cryptic-game.net/file/' + deviceUUID + '/' + fileUUID, { 'headers': {
        "Token": app.dataStorage['token']
      }}).then(response => {
        if(response.body['ok']) {
          delete app.dataStorage['devices'][deviceUUID]['files'][fileUUID]
        }
      });
    }
  },
  'currency': {
    'get': function(walletUUID, walletKey, callback, error) {
      Vue.http.get('https://currency.api.cryptic-game.net/wallet/' + walletUUID, { 'headers': {
        "Token": app.dataStorage['token'],
        "Key": walletKey,
      }}).then(response => {
        callback(response.body);
      }, response => {
        error();
      });
    }
  },
  'service': {
    'getAll': function(deviceUUID) {
      Vue.http.get('https://service.api.cryptic-game.net/service/private/' + deviceUUID, { 'headers': {
        "Token": app.dataStorage['token'],
      }}).then(response => {
        var services = response.body['services'];

        services.forEach(service => {
          app.dataStorage.devices[deviceUUID].services[service.uuid] = service;
        });
      }, response => {
        error();
      });
    },
    'create': function(deviceUUID, name) {
      Vue.http.put('https://service.api.cryptic-game.net/service/private/' + deviceUUID, JSON.stringify({
        'name': name, // "SSH", "Telnet", "Hydra"
      }),{ 'headers': {
        "Token": app.dataStorage['token'],
      }}).then(response => {
        var service = response.body;

        app.dataStorage.devices[deviceUUID].services[service.uuid] = service;

        output.success('Created service ' + service.name + '!');
      });
    },
    'check': function(deviceUUID, owner, callback, error) {
      Vue.http.post('https://service.api.cryptic-game.net/service/private/' + deviceUUID, '',{ 'headers': {
        "Token": app.dataStorage['token'],
      }}).then(response => {
        var result = response.body['ok'];

        callback(result);
      }, response => {
        error();
      });
    },
    'delete': function(deviceUUID, serviceUUID) {
      Vue.http.delete('https://service.api.cryptic-game.net/service/private/' + deviceUUID + '/' + serviceUUID, { 'headers': {
        "Token": app.dataStorage['token'],
      }}).then(response => {
      });
    },
    'toggle': function(deviceUUID, serviceUUID) {
      Vue.http.post('https://service.api.cryptic-game.net/service/private/' + deviceUUID + '/' + serviceUUID, '', { 'headers': {
        "Token": app.dataStorage['token'],
      }}).then(response => {
      });
    },
    'getPublicService': function(deviceUUID, serviceUUID, callback, error) {
      Vue.http.get('https://service.api.cryptic-game.net/service/public/' + deviceUUID + '/' + serviceUUID, { 'headers': {
        "Token": app.dataStorage['token'],
      }}).then(response => {
        callback(response.body);
      }, response => {
        error();
      });
    },
    'hack': function(deviceUUID, serviceUUID, targetDeviceUUID, targetServiceUUID, callback, error) {
      Vue.http.post('https://service.api.cryptic-game.net/service/public/' + deviceUUID + '/' + serviceUUID, JSON.stringify({
        'target_device': targetServiceUUID,
        'target_service': targetServiceUUID,
      }), { 'headers': {
        "Token": app.dataStorage['token'],
      }}).then(response => {
        callback(response.body);
      }, response => {
        error();
      });
    }
  }
}

