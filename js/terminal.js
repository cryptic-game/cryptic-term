/**
 * <p>Namespace for functions to handle interactions with the user as frontend to [<code>shell</code>]{@link shell}.</p>
 * @namespace terminal
  */
const terminal = {
  /**
   * @description
   * <p>Prints a line.</p>
   * <p>This function is not intended to be used directly, but only as a help function for [<code>terminal.log</code>]{@link terminal.log}, [<code>terminal.success</code>]{@link terminal.success}, [<code>terminal.warning</code>]{@link terminal.warning} and [<code>terminal.error</code>]{@link terminal.error}.</p>
   * @param {string} text - The text content of the line.
   * @param {string} type - A CSS class added to the line (one of <code>msg-prompt</code>, <code>msg-log</code>, <code>msg-success</code>, <code>msg-warning</code>, <code>msg-error</code>).
   * @see {@link terminal.log}
   * @see {@link terminal.success}
   * @see {@link terminal.warning}
   * @see {@link terminal.error}
   */
  print: (text, type) => {
    app.lines.push({ text, type })
    window.scrollTo({
      top: document.body.scrollHeight
    })
  },
  /**
   * @description
   * <p>[Prints]{@link terminal.print} a line of type <code>msg-log</code>.</p>
   * @param {string} text - The text content of the line.
   * @see {@link terminal.print}
   * @see {@link terminal.success}
   * @see {@link terminal.warning}
   * @see {@link terminal.error}
   */
  log: text => {
    terminal.print(text, 'msg-log')
  },
  /**
   * @description
   * <p>[Prints]{@link terminal.print} a line of type <code>msg-success</code>.</p>
   * @param {string} text - The text content of the line.
   * @see {@link terminal.print}
   * @see {@link terminal.log}
   * @see {@link terminal.warning}
   * @see {@link terminal.error}
   */
  success: text => {
    terminal.print(text, 'msg-success')
  },
  /**
   * @description
   * <p>[Prints]{@link terminal.print} a line of type <code>msg-warning</code>.</p>
   * @param {string} text - The text content of the line.
   * @see {@link terminal.print}
   * @see {@link terminal.log}
   * @see {@link terminal.success}
   * @see {@link terminal.error}
   */
  warning: text => {
    terminal.print(text, 'msg-warning')
  },
  /**
   * @description
   * <p>[Prints]{@link terminal.print} a line of type <code>msg-error</code>.</p>
   * @param {string} text - The text content of the line.
   * @see {@link terminal.print}
   * @see {@link terminal.log}
   * @see {@link terminal.success}
   * @see {@link terminal.warning}
   */
  error: text => {
    terminal.print(text, 'msg-error')
  },
  /**
   * @description
   * </p>Connect the terminal to the shell and prompt the user for input.</p>
   * @async
   */
  init: async () => {
    // force focus on input
    const cmdEl = document.getElementById('cmd')
    cmdEl.onblur = event => {
      cmdEl.focus()
    }
    // auto expand
    cmdEl.oninput = event => {
      cmdEl.size = cmdEl.value.length + 1
    }

    while (true) {
      const command = await terminal.prompt(app.ps, 'text')
      await shell.runCommand(command).catch(error => {
        console.error(error)
        terminal.error('An unexpected error occured')
      })
    }
  },
  /**
   * @description
   * <p>Prompt the user for an input (Submit with <kbd>Return</kbd>).</p>
   * @param {string} ps - The prompt string.
   * @param {string} type - The <code>type</code> attribute of the HTML input (either <code>text</code> or <code>password</code>).
   * @returns {Promise} A Promise resolving the user input.
   */
  prompt: (ps, type) => {
    const cmdEl = document.getElementById('cmd')
    const prompt = document.getElementById('prompt')

    cmdEl.value = ''
    cmdEl.type = type
    cmdEl.size = '2'

    const prevPs = app.ps
    app.ps = ps

    prompt.style.display = 'initial'
    cmdEl.select()
    window.scrollTo({
      left: 0,
      top: document.body.scrollHeight
    })

    return new Promise((resolve, reject) => {
      cmdEl.onkeypress = event => {
        if (event.which !== 13 || cmdEl.value === '') {
          return
        }

        event.preventDefault()

        const input = cmdEl.value
        const hidden = type === 'password'

        terminal.print(`${ps} ${hidden ? '' : input}`, 'msg-prompt')
        app.ps = prevPs
        prompt.style.display = 'none'

        resolve(input)
      }
    })
  }
}
