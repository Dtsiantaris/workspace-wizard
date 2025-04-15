import { app, BrowserWindow } from 'electron';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url'
import koffi from 'koffi'
import type { EnumeratedWindow } from 'app/src-electron/windows/types';
import { isSystemWindow } from 'app/src-electron/windows/tools';
import { getProcessPath } from 'app/src-electron/windows/process';
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

// Load user32.dll
const user32 = koffi.load('user32.dll');

// Define the callback function type (must use __stdcall on Windows)
const EnumWindowsProc = koffi.proto('bool __stdcall EnumWindowsProc(void* hWnd, long lParam)');

// Define necessary functions
const EnumWindows = user32.func('bool EnumWindows(EnumWindowsProc* lpEnumFunc, long lParam)');
const GetWindowTextW = user32.func('int GetWindowTextW(void* hWnd, wchar_t* lpString, int nMaxCount)');
const IsWindowVisible = user32.func('bool IsWindowVisible(void* hWnd)');
const GetWindowThreadProcessId = user32.func('uint32 GetWindowThreadProcessId(void* hWnd, uint32* lpdwProcessId)');


// Create an array to store window information
const EnumeratedWindows: EnumeratedWindow[] = [];

// Register the callback function
const enumCallback = koffi.register((hWnd: unknown) => {
    // Check if window is visible
    if (IsWindowVisible(hWnd)) {
        // Get window title
        const buffer = Buffer.alloc(512);
        GetWindowTextW(hWnd, buffer, 256);
        const title = buffer.toString('ucs2').replace(/\0+$/, '');

        // Get process ID using Buffer
        const pidBuffer = Buffer.alloc(4);
        GetWindowThreadProcessId(hWnd, pidBuffer);
        const pid = pidBuffer.readUInt32LE(0);

        // Only add windows with titles
        if (title.length > 0) {
            EnumeratedWindows.push({
                handle: hWnd,
                title: title,
                processId: pid
            });
        }
    }

    // Return true to continue enumeration
    return true;
}, koffi.pointer(EnumWindowsProc));

// Enumerate all top-level windows
EnumWindows(enumCallback, 0);

// Unregister the callback when done
koffi.unregister(enumCallback);

console.log(`Found ${EnumeratedWindows.length} visible windows:`);
EnumeratedWindows.forEach((enWindow, index) => {
    console.log(`${index + 1}. ${enWindow.title} (PID: ${enWindow.processId})`);
    console.log('IS SYSTEM WINDOW:', isSystemWindow(enWindow))
    if(!isSystemWindow(enWindow)) {
      const processPath = getProcessPath(enWindow.processId);
      console.log('Process path', processPath)
    }
});
