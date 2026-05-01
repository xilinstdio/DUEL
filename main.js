const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'icon.png'),
    title: '卡牌对决Demo'
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.on('closed', () => {
    mainWindow.destroy();
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});