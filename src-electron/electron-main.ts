import { app, BrowserWindow } from 'electron';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url'
import psList from 'ps-list';
import psNode from 'ps-node';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

const currentDir = fileURLToPath(new URL('.', import.meta.url));

let mainWindow: BrowserWindow | undefined;

async function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(
        currentDir,
        path.join(process.env.QUASAR_ELECTRON_PRELOAD_FOLDER, 'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION)
      ),
    },
  });

  if (process.env.DEV) {
    await mainWindow.loadURL(process.env.APP_URL);
  } else {
    await mainWindow.loadFile('index.html');
  }

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

void app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    void createWindow();
  }
});

const AllProcesses = await psList({ all: false });

const GroupedByParent = AllProcesses.reduce((map, process) => {
  const ppid = process.ppid;

  // Check if the map already has this ppid as a key
  if (!map.has(ppid)) {
    map.set(ppid, []);
  }

  // Push the current process into the array for this ppid
  map.get(ppid)!.push(process);

  return map;
}, new Map<number, typeof AllProcesses>());


GroupedByParent.forEach((_val, key) => {
  psNode.lookup({pid:key}, (err, resultList) => {
    if(err) {
      throw new Error(err.message)
    }

    console.log('program', resultList[0].)
  })
})
