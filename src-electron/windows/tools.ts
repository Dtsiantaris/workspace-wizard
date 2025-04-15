import { getWindowClass } from "app/src-electron/windows/class"
import type { EnumeratedWindow } from "app/src-electron/windows/types"
import koffi from 'koffi'

const user32 = koffi.load('user32.dll')

export const isSystemWindow = (
  EnumeratedWindow: EnumeratedWindow
) => {
  const systemClasses = [
    'Windows.UI.Core.CoreWindow',
    'ApplicationFrameWindow',
    'Progman',
    'Shell_TrayWnd',
    'DummyDWMListenerWindow',
    'WorkerW',
  ]

  const systemTitles = [
    'Windows Input Experience',
    'Windows Shell Experience Host',
    'Search',
    'Start',
    'Program Manager',
    'Windows Default Lock Screen',
    'New notification',
  ]

  const className = getWindowClass(EnumeratedWindow.handle)

  if (className && systemClasses.includes(className)) return true

  if (systemTitles.some(sysTitle => EnumeratedWindow.title.includes(sysTitle))) return true

  return false
}

export function closeWindow(hWnd: unknown) {
  const WM_CLOSE = 0x0010;
  const PostMessageW = user32.func('bool PostMessageW(void* hWnd, uint32 Msg, size_t wParam, size_t lParam)');

  return PostMessageW(hWnd, WM_CLOSE, 0, 0);
}
