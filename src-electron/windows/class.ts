import koffi from 'koffi'

const user32 = koffi.load('user32.dll')
const GetClassNameW = user32.func('int GetClassNameW(void* hWnd, wchar_t* lpClassName, int nMaxCount)');

export function getWindowClass(hWnd: unknown) {
  const buffer = Buffer.alloc(512);
  const length = GetClassNameW(hWnd, buffer, 256);
  if (length === 0) return null;
  return buffer.toString('ucs2', 0, length * 2).replace(/\0+$/, '');
}
