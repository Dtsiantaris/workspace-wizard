import koffi from 'koffi';

const kernel32 = koffi.load('kernel32.dll');
const OpenProcess = kernel32.func('void* OpenProcess(uint32 dwDesiredAccess, bool bInheritHandle, uint32 dwProcessId)');
const TerminateProcess = kernel32.func('bool TerminateProcess(void* hProcess, uint32 uExitCode)');
const CloseHandle = kernel32.func('bool CloseHandle(void* hObject)');

const PROCESS_QUERY_INFORMATION = 0x0400;
const PROCESS_VM_READ = 0x0010;
const PROCESS_TERMINATE = 0x0001;

const psapi = koffi.load('psapi.dll');
const GetModuleFileNameExW = psapi.func('uint32 GetModuleFileNameExW(void* hProcess, void* hModule, wchar_t* lpFilename, uint32 nSize)');

export function getProcessPath(pid: number) {
    const hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, pid);
    if (!hProcess) return null;

    const buffer = Buffer.alloc(1024);
    const length = GetModuleFileNameExW(hProcess, null, buffer, 512);
    CloseHandle(hProcess);

    if (length === 0) return null;
    return buffer.toString('ucs2', 0, length * 2).replace(/\\0+$/, '');
}

export const killProcess = (pid: number) => {
  const hProcess = OpenProcess(PROCESS_TERMINATE, false, pid);
    if (!hProcess) return false;

    const result = TerminateProcess(hProcess, 0);
    CloseHandle(hProcess);
    return result;
}
