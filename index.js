const { app, BrowserWindow } = require('electron');

let prod = true;

function createWindow() {
  let win = new BrowserWindow({ width: 800, height: 600 });

  win.setMenu(null);
  win.loadFile('index.html');

  if(!prod) {
    win.webContents.openDevTools();
  }
}

app.on('ready', createWindow);
