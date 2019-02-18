// TODO: check if all async

shell.commandHandlers._ = async command => {
  terminal.error(`Command not found: ${command.name}`)
}

shell.commandHandlers.boot = async command => {
  if (shell.level !== 1 || command.args.length !== 1) {
    terminal.warning('Usage: boot <device-name>')
    return
  }

  const deviceName = command.args[0]
  const device = util.getDevice(deviceName)

  if (device.powered_on) {
    terminal.error('Device is already online')
    return
  }

  await api.device.toggle(device.uuid).then(() => {
    terminal.success(`Device '${deviceName}' was booted`)
  }).catch(util.printErrorMessage)
}

shell.commandHandlers.cat = async command => {
  if (!util.isConnected()) {
    terminal.error('You are not connected to a device')
    return
  }

  if (command.args.length !== 1) {
    terminal.warning('Usage: cat <file>')
    return
  }

  const file = util.getFile(command.args[0])
  if (file === null) {
    terminal.error('File not found')
  } else {
    terminal.log(file.content)
  }
}

shell.commandHandlers.clear = async command => {
  app.lines = []
}

shell.commandHandlers.connect = async command => {
  if (shell.level < 1) {
    terminal.error('You are not logged in')
    return
  }

  if (command.args.length !== 1) {
    terminal.warning('Usage: connect <device-name>')
    return
  }

  const deviceName = command.args[0]
  const device = util.getDevice(deviceName)

  if (device === null) {
    terminal.error('Device not found')
    return
  }

  if (!device.powered_on) {
    terminal.error('Device is offline')
    return
  }

  shell.device = device
  shell.level = 2
  util.updatePs()

  terminal.success('Connection was established')
}

shell.commandHandlers.cp = async command => {
  if (!util.isConnected()) {
    terminal.error('You are not connected to a device')
    return
  }

  if (command.args.length !== 2) {
    terminal.warning('Usage: cp <source> <destination>')
    return
  }

  const source = util.getFile(command.args[0])
  const destination = util.getFile(command.args[1])

  if (source === null) {
    terminal.error('File not found')
    return
  }

  if (destination !== null) {
    terminal.error('File already exists')
    return
  }

  await api.file.create(shell.device.uuid, command.args[1], source.content).catch(util.printErrorMessage)
}

shell.commandHandlers.device = async command => {
  if (shell.level < 1) {
    terminal.error('You are not logged in')
    return
  }

  if (command.args.length === 1) {
    const devices = Object.keys(app.dataStorage.devices)
    switch (command.args[0]) {
      case 'list':
        if (devices.length === 0) {
          terminal.log('No devices')
        } else {
          for (let i = 0; i < devices.length; i++) {
            let device = app.dataStorage.devices[devices[i]]
            terminal.log(device.name)
          }
        }
        return
      case 'create':
        await api.device.create().then(() => {
          terminal.success('Device was created')
          terminal.log('Use \'device list\' to show')
        }).catch(util.printErrorMessage)
        return
    }
  }

  terminal.warning('Usage: device (list|create)')
}

shell.commandHandlers.exit = async command => {
  switch (shell.level) {
    case 0:
      require('electron').remote.getCurrentWindow().close()
      break
    case 1:
      await api.user.logout().then(() => {
        shell.level--
        util.updatePs()
      }).catch(util.printErrorMessage)
      break
    case 2:
      shell.device = null
      shell.level--
      util.updatePs()
      break
  }
}

shell.commandHandlers.hostname = async command => {
  if (!util.isConnected()) {
    terminal.error('You are not connected to a device')
    return
  }

  if (command.args.length > 1) {
    terminal.warning('Usage: hostname [new-hostname]')
    return
  }

  if (command.args.length === 0) {
    terminal.log(shell.device.name)
    return
  }

  const newHostname = command.args[0]
  await api.device.changeName(shell.device.uuid, newHostname).then(() => {
    util.updatePs()
    terminal.success(`Hostname was changed to '${newHostname}'`)
  }).catch(util.printErrorMessage)
}

shell.commandHandlers.login = async command => {
  const username = await terminal.prompt('username:', 'text')
  const password = await terminal.prompt('password:', 'password')
  await api.user.login(username, password).then(() => {
    shell.username = username
    shell.level = 1
    util.updatePs()
  }).catch(util.printErrorMessage)
}

shell.commandHandlers.ls = async command => {
  if (!util.isConnected()) {
    terminal.error('You are not connected to a device')
    return
  }

  const files = shell.device.files
  if (files !== null) {
    if (files.length === 0) {
      terminal.log('no files')
    } else {
      const fileKeys = Object.keys(files)
      for (let i = 0; i < fileKeys.length; i++) {
        let file = files[fileKeys[i]]
        terminal.log(file.filename)
      }
    }
  }
}

shell.commandHandlers.morpcoin = async command => {
  if (!util.isConnected()) {
    terminal.error('You are not connected to a device')
    return
  }

  if (command.args.length !== 1) {
    terminal.warning('Usage: morpcoin <filename>')
    return
  }

  const file = util.getFile(command.args[0])

  if (file === null) {
    terminal.error('File not found')
    return
  }

  const lines = file.content.split('\n')

  const uuid = lines[0].slice(5)
  const key = lines[1].slice(4)

  if (lines.length !== 2 || uuid === '' || key === '') {
    terminal.error('Invalid wallet file')
    return
  }

  await api.currency.get(uuid, key).then(wallet => {
    terminal.log(`${wallet.amount} Morpcoin`)
  }).catch(util.printErrorMessage)
}

shell.commandHandlers.register = async command => {
  const username = await terminal.prompt('username:', 'text')
  const email = await terminal.prompt('email:', 'email')
  const password = await terminal.prompt('password:', 'password')
  const passwordConf = await terminal.prompt('repeat password:', 'password')

  if (password !== passwordConf) {
    terminal.error('Passwords do not match')
    return
  }

  await api.user.register(email, username, password).then(response => {
    terminal.success(`Account '${username}' was registered`)
    terminal.log('Use \'login\' to log into your account')
  }).catch(util.printErrorMessage)
}

shell.commandHandlers.rm = async command => {
  if (!util.isConnected()) {
    terminal.error('You are not connected to a device')
    return
  }

  if (command.args.length !== 1) {
    terminal.warning('Usage: rm <filename>')
    return
  }

  const file = util.getFile(command.args[0])

  if (file === null) {
    terminal.error('File not found')
    return
  }

  await api.file.delete(shell.device.uuid, file.uuid).then(() => {
    terminal.success(`File '${file.filename}' was deleted`)
  }).catch(util.printErrorMessage)
}

shell.commandHandlers.service = async command => {
  if (!util.isConnected()) {
    terminal.error('You are not connected to a device')
    return
  }

  if (command.args[0] === 'create' && command.args.length === 2) {
    const service = command.args[1]
    const services = ['Hydra', 'SSH', 'Telnet']
    if (!services.includes(service)) {
      terminal.error(`Unknown service '${service}' (Use ${services.join('|')})`)
      return
    }
    await api.service.create(shell.device.uuid, service).then(() => {
      terminal.success('Service was created')
    }).catch(util.printErrorMessage)
  } else if (command.args[0] === 'bruteforce' && command.args.length === 4) {
    const [service, targetDevice, targetService] = command.args.slice(1)
    await api.service.hack(shell.device.uuid, service, targetDevice, targetService).then(result => {
      console.log(result)
      if (!result.ok) {
        terminal.error('Bruteforce not available')
        return
      }

      if (result.access === null || result.time === null) {
        terminal.log('Starting bruteforce ...')
        return
      }

      terminal.log(`Stopped bruteforce after ${result.time}s`)

      if (result.access) {
        terminal.succes('Access gained')
      } else {
        terminal.error('Access denied')
      }
    }).catch(util.printErrorMessage)
  } else {
    terminal.warning('Usage: service (create <name>|bruteforce <service> <target-device> <target-service>)')
  }
}

shell.commandHandlers.shutdown = async command => {
  if (!util.isConnected()) {
    terminal.error('You are not connected to a device')
    return
  }

  if (!shell.device.powered_on) {
    terminal.error('Device is already offline')
    return
  }

  await api.device.toggle(shell.device.uuid).then(() => {
    terminal.success(`Device ${shell.device.name} was shut down`)
    shell.level = 1
    util.updatePs()
  }).catch(util.printErrorMessage)
}

shell.commandHandlers.touch = async command => {
  if (!util.isConnected()) {
    terminal.error('You are not connected to a device')
    return
  }

  if (command.args.length === 0) {
    terminal.warning('Usage: touch <filename> [content]')
    return
  }

  const content = command.args.slice(1).join(' ')
  await api.file.create(shell.device.uuid, command.args[0], content).then(() => {
    terminal.success(`File '${command.args[0]}' was created`)
  }).catch(util.printErrorMessage)
}
