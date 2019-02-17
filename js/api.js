const api = {
  user: {
    login: (username, password) => {
      return Vue.http.post('https://user.api.cryptic-game.net/auth', {
        username,
        password
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }
        app.dataStorage.token = response.body.token
      }).then(api.device.getAll)
    },
    register: (email, username, password) => {
      return Vue.http.put('https://user.api.cryptic-game.net/auth', {
        email,
        username,
        password
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }
      })
    },
    logout: () => {
      return Vue.http.delete('https://user.api.cryptic-game.net/auth', '', {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }
      })
    }
  },
  device: {
    getAll: () => {
      return Vue.http.get('https://device.api.cryptic-game.net/device/private', {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }

        for (let i = 0; i < response.body.devices.length; i++) {
          let device = response.body.devices[i]

          util.setDevice(device)

          api.file.getAll(device.uuid)
          api.service.getAll(device.uuid)
        }
      })
    },
    create: () => {
      return Vue.http.put('https://device.api.cryptic-game.net/device/private', '', {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }

        util.setDevice(response.body)
      })
    },
    toggle: uuid => {
      return Vue.http.post(`https://device.api.cryptic-game.net/device/private/${uuid}`, '', {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }

        util.setDevice(response.body)
      })
    },
    delete: uuid => {
      return Vue.http.delete(`https://device.api.cryptic-game.net/device/private/${uuid}`, {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }

        if (response.body.success) {
          delete app.dataStorage.devices[uuid]
        }
      })
    },
    changeName: (uuid, name) => {
      return Vue.http.put(`https://device.api.cryptic-game.net/device/private/${uuid}`, {
        name
      }, {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }

        util.setDevice(response.body)
      })
    },
    getPublicDevice: uuid => {
      return Vue.http.get(`https://device.api.cryptic-game.net/device/public/${uuid}`, {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }

        util.setDevice(response.body)
      })
    }
  },
  file: {
    create: (deviceUUID, filename, content) => {
      return Vue.http.put(`https://device.api.cryptic-game.net/file/${deviceUUID}`, {
        filename,
        content
      }, {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }

        util.setFile(response.body)
      })
    },
    getAll: deviceUUID => {
      return Vue.http.get(`https://device.api.cryptic-game.net/file/${deviceUUID}`, {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }

        const files = response.body.files
        for (let i = 0; i < files.length; i++) {
          util.setFile(files[i])
        }
      })
    },
    delete: (deviceUUID, fileUUID) => {
      return Vue.http.delete(`https://device.api.cryptic-game.net/file/${deviceUUID}/${fileUUID}`, {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }

        delete app.dataStorage.devices[deviceUUID].files[fileUUID]
      })
    }
  },
  currency: {
    get: (walletUUID, walletKey) => {
      return Vue.http.get(`https://currency.api.cryptic-game.net/wallet/${walletUUID}`, {
        headers: {
          Token: app.dataStorage.token,
          Key: walletKey
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }
        return response.body
      })
    }
  },
  service: {
    getAll: deviceUUID => {
      return Vue.http.get(`https://service.api.cryptic-game.net/service/private/${deviceUUID}`, {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }

        const services = response.body.services

        for (let i = 0; i < services.length; i++) {
          let service = services[i]
          app.dataStorage.devices[deviceUUID].services[service.uuid] = service
        }
      })
    },
    create: (deviceUUID, name) => {
      return Vue.http.put(`https://service.api.cryptic-game.net/service/private/${deviceUUID}`, {
        name // 'SSH', 'Telnet', 'Hydra'
      }, {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }

        const service = response.body

        app.dataStorage.devices[deviceUUID].services[service.uuid] = service
      })
    },
    check: (deviceUUID, owner) => {
      return Vue.http.post(`https://service.api.cryptic-game.net/service/private/${deviceUUID}`, '', {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        return response.body.ok
      })
    },
    delete: (deviceUUID, serviceUUID) => {
      return Vue.http.delete(`https://service.api.cryptic-game.net/service/private/${deviceUUID}/${serviceUUID}`, {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }
      })
    },
    toggle: (deviceUUID, serviceUUID) => {
      return Vue.http.post(`https://service.api.cryptic-game.net/service/private/${deviceUUID}/${serviceUUID}`, '', {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }
      })
    },
    getPublicService: (deviceUUID, serviceUUID) => {
      return Vue.http.get(`https://service.api.cryptic-game.net/service/public/${deviceUUID}/${serviceUUID}`, {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }
      })
    },
    hack: (deviceUUID, serviceUUID, targetDeviceUUID, targetServiceUUID) => {
      return Vue.http.post(`https://service.api.cryptic-game.net/service/public/${deviceUUID}/${serviceUUID}`, JSON.stringify({
        target_device: targetServiceUUID,
        target_service: targetServiceUUID
      }), {
        headers: {
          Token: app.dataStorage.token
        }
      }).then(response => {
        console.log(response)
        if (!response.ok) {
          throw response
        }
      })
    }
  }
}
