/**
 * <p>Utility functions for command handlers.</p>
 * @namespace util
 */
const util = {
  /**
   * @description
   * <p>Checks whether the user is connected to a device.</p>
   * @return {boolean} The connection status.
   */
  isConnected: () => {
    return shell.level >= 2 && shell.device !== null
  },
  /**
   * @description
   * <p>Gets a device by its name.</p>
   * @param {string} deviceName - The name of a device.
   * @return {Object.<string, any>|null} The device object or <code>null</code> if no device with the given name exists.
   */
  getDevice: deviceName => {
    const deviceKeys = Object.keys(app.dataStorage.devices)
    for (let i = 0; i < deviceKeys.length; i++) {
      let device = app.dataStorage.devices[deviceKeys[i]]
      if (device.name === deviceName) {
        return device
      }
    }
    return null
  },
  /**
   * @description
   * <p>Gets a file by its name.</p>
   * @param {string} fileName - The name of a file.
   * @return {Object.<string, any>|null} The file object or <code>null</code> if no file with the given name exists.
   */
  getFile: fileName => {
    const fileKeys = Object.keys(shell.device.files)
    for (let i = 0; i < fileKeys.length; i++) {
      let file = shell.device.files[fileKeys[i]]
      if (file.filename === fileName) {
        return file
      }
    }
    return null
  },
  /**
   * @description
   * <p>Prints an error message using [<code>terminal.error</code>]{@link terminal.error} that is wrapped inside an object.</p>
   * <p>The message defaults to 'An error occured' if no error string is found inside the object.</p>
   * @param {Object|Error} errorWrapper - The object wrapping an error string (usually the response from a Vue request).
   */
  printErrorMessage: errorWrapper => {
    terminal.error(errorWrapper.message ||
      (errorWrapper.body && errorWrapper.body.message) ||
      'An error occured')
  },
  /**
   * @description
   * <p>Adds/Overwrites a device.</p>
   * @param {Object.<string, any>} device - A device object.
   */
  setDevice: device => {
    device.files = {}
    device.services = {}
    app.dataStorage.devices[device.uuid] = device
  },
  /**
   * @description
   * <p>Adds/Overwrites a file on the connected device.</p>
   * @param {Object.<string, any>} file - A file object.
   */
  setFile: file => {
    app.dataStorage.devices[file.device].files[file.uuid] = file
  },
  /**
   * @description
   * <p>Blocks the terminal for a given time.</p>
   * @param {Number} ms - The time to sleep in milliseconds.
   * @return {Promise} A Promise that resolves when the times has passed.
   * @example
   * await util.sleep(1000)
   */
  sleep: ms => {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms)
    })
  },
  /**
   * @description
   * <p>Sets the prompt string according to the current [<code>shell.level</code>]{@link shell.level}.</p>
   * <p><code>{username} @ {device} $</code></p>
   */
  updatePs: () => {
    let ps = '$'
    if (shell.level >= 2) {
      ps = `@ ${shell.device.name} ${ps}`
    }
    if (shell.level >= 1) {
      ps = `${shell.username} ${ps}`
    }
    app.ps = ps
  }
}
