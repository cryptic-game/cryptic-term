/**
 * <p>Namespace for functions to handle CLI commands by the user.</p>
 * @namespace shell
 */
const shell = {
  /**
   * @description
   * <p>Maps the name of a command to a function that handles the command.</p>
   * <p>When a command is executed using [<code>shell.runCommand</code>]{@link shell.runCommand} the corresponding handler is called. The return value of [<code>shell.parseCommand</code>]{@link shell.parseCommand} is passed to the handler.</p>
   * @type {Object.<string, function(Object): any>}
   * @see {@link shell.parseCommand}
   * @see {@link shell.runCommand}
   * @example <caption>Add a command handler</caption>
   * shell.commandHandlers.help = async command => {
   *   console.log('print help here')
   * }
   */
  commandHandlers: {},
  /**
   * @description
   * <p>Represents the device to which the user is currently connected or <code>null</code> if they are not connected to any device.</p>
   * @type {Object.<string, any>|null}
   */
  device: null,
  /**
   * @description
   * <p>The shell level the user is currently at. The level can be increased by 1 with specific commands. With <code>exit</code> the level is decremented.</p>
   * <table>
   *  <tr><th>Value</th><th>Meaning</th><th>Command to reach</th></tr>
   *  <tr><td>0</td><td>Unauthorized (default)</td><td></td></tr>
   *  <tr><td>1</td><td>Logged in</td><td><kbd>login</kbd></td></tr>
   *  <tr><td>2</td><td>Connected to a device</td><td><kbd>connect</kbd></td></tr>
   * </table>
   * @type {Number}
   */
  level: 0,
  /**
   * @typedef {Object} ParsedCommand
   * @property {string} name - The name of the command.
   * @property {Array.<(string|boolean|Number)>} args - Array of positional arguments.
   * @property {Object.<string, (string|boolean|Number)>} options - Object mapping an option to a value. An option is entered with leading hyphens, the (optional) value follows a whitespace character.
   * @property {string} raw - The command which has been parsed.
   * @see {@link shell.parseCommand}
   * @example
   * {
   *   name: 'foobar',
   *   args: [ 'Hello', 'World' ],
   *   options: { foo: 2, bar: true, baz: true, qux: 'Lorem ipsum' },
   *   raw: 'foobar --foo 2 --bar True --baz --qux "Lorem ipsum" Hello World'
   * }
   */
  /**
   * @description
   * <p>Parses a command entered by the user.</p>
   * <p>This function is not intended to be used directly, but only as a help function for [<code>shell.runCommand</code>]{@link shell.runCommand}.</p>
   * @param {string} commandString - The command to be parsed.
   * @returns {ParsedCommand} The parsed command.
   * @throws {Error} Invalid type '{type}' for argument 'commandString'
   * @see {@link shell.runCommand}
   * @see {@link ParsedCommand}
   * @example
   * shell.parseCommand('foobar --foo 2 --bar True --baz --qux "Lorem ipsum" Hello World')
   * // {
   * //   name: 'foobar',
   * //   args: [ 'Hello', 'World' ],
   * //   options: { foo: 2, bar: true, baz: true, qux: 'Lorem ipsum' },
   * //   raw: 'foobar --foo 2 --bar True --baz --qux "Lorem ipsum" Hello World'
   * // }
   */
  parseCommand: commandString => {
    if (typeof commandString !== 'string') {
      throw Error(`Invalid type '${typeof commandString}' for argument 'commandString'`)
    }

    // convert string to boolean or number if possible
    const convertType = value => {
      if (isNaN(value)) {
        if (value.toLocaleLowerCase() === 'true') {
          return true
        } else if (value.toLocaleLowerCase() === 'false') {
          return false
        }
      } else {
        return Number(value)
      }
      // remove surrounding quotation marks
      if (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1)
      }
      return value
    }

    const tokens = commandString.match(/(?:[^\s"]+|"[^"]*")+/g)
    const name = tokens.shift()

    const args = []
    const options = {}

    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i]
      if (token.charAt(0) === '-') {
        // option
        let option = token.replace(/^-+/, '') // remove hyphens
        if (option.length === 0) {
          continue
        }
        // use the next token as the value for the option if it is not an option itself
        if (i + 1 < tokens.length && tokens[i + 1].charAt(0) !== '-') {
          options[option] = convertType(tokens[++i])
        } else {
          options[option] = true
        }
      } else {
        // argument
        args.push(convertType(token))
      }
    }

    return {
      name,
      args,
      options,
      raw: commandString
    }
  },
  /**
   * @description
   * <p>Executes the handler for a command entered by the user.</p>
   * <p>If no handler is defined for a command, the handler for "<code>_</code>" is used as fallback. If it is not defined either, an exception is thrown.</p>
   * @param {string} commandString - The command to be executed.
   * @returns {any} Forward the return value of the handler.
   * @throws {Error} Command not found: {command}
   * @see {@link shell.commandHandlers}
   */
  runCommand: commandString => {
    const command = shell.parseCommand(commandString)
    let key = command.name
    if (!shell.commandHandlers.hasOwnProperty(key)) {
      if (!shell.commandHandlers.hasOwnProperty('_')) {
        throw Error(`Command not found: ${key}`)
      }
      key = '_' // fallback
    }
    return shell.commandHandlers[key](command)
  },
  username: null
}
