#include <windows.h>
#include <shlobj.h>
#include <shobjidl.h>
#include <wrl/client.h>
#include <string>
#include <vector>
using Microsoft::WRL::ComPtr;
struct Payload { int resource; const wchar_t* name; };
const Payload files[] = {{201,L"ExtrudaCamera.exe"},{202,L"ExtrudaCamera-0.3.dll"},{203,L"README.md"},{204,L"UPSTREAM-LICENSE.txt"},{205,L"THIRD_PARTY_NOTICES.txt"},{206,L"LICENSE.txt"},{300,L"ui\\index.html"},{301,L"ui\\style.css"},{302,L"ui\\app.js"},{303,L"ui\\qr.js"},{304,L"ui\\brand\\logo.svg"},{305,L"ui\\brand\\camera.svg"},{306,L"ui\\brand\\tokens.css"},{307,L"ui\\fonts\\Nunito-Variable.woff2"},{308,L"ui\\fonts\\Inter-Variable.woff2"},{309,L"ui\\fonts\\Nunito-OFL.txt"},{310,L"ui\\fonts\\Inter-OFL.txt"}};
std::wstring KnownFolder(REFKNOWNFOLDERID id) { PWSTR p = nullptr; if (FAILED(SHGetKnownFolderPath(id, 0, nullptr, &p))) return {}; std::wstring result(p); CoTaskMemFree(p); return result; }
HRESULT ExportRegistration(const std::wstring& path, bool remove) {
    auto library = LoadLibraryExW(path.c_str(), nullptr, LOAD_WITH_ALTERED_SEARCH_PATH);
    if (!library) return HRESULT_FROM_WIN32(GetLastError());
    auto function = reinterpret_cast<HRESULT(WINAPI*)()>(GetProcAddress(library, remove ? "DllUnregisterServer" : "DllRegisterServer"));
    auto hr = function ? function() : E_NOINTERFACE; FreeLibrary(library); return hr;
}
HRESULT RunSetup(HINSTANCE instance, bool remove) {
    auto folder = KnownFolder(FOLDERID_ProgramFiles) + L"\\Extruda Phone Camera";
    auto shortcut = KnownFolder(FOLDERID_CommonPrograms) + L"\\Extruda Phone Camera.lnk";
    auto appMutex = OpenMutexW(SYNCHRONIZE, FALSE, L"Local\\ExtrudaPhoneCameraReceiver");
    if (appMutex) { CloseHandle(appMutex); return HRESULT_FROM_WIN32(ERROR_BUSY); }
    if (remove) {
        auto hr = ExportRegistration(folder + L"\\ExtrudaCamera-0.3.dll", true);
        if (FAILED(hr) && hr != HRESULT_FROM_WIN32(ERROR_FILE_NOT_FOUND) && hr != HRESULT_FROM_WIN32(ERROR_MOD_NOT_FOUND)) return hr;
        DeleteFileW(shortcut.c_str());
        for (const auto& file : files) { auto path = folder + L"\\" + file.name; if (!DeleteFileW(path.c_str()) && GetLastError() == ERROR_SHARING_VIOLATION) MoveFileExW(path.c_str(), nullptr, MOVEFILE_DELAY_UNTIL_REBOOT); }
        for (const auto& directory : {L"\\ui\\fonts",L"\\ui\\brand",L"\\ui"}) RemoveDirectoryW((folder + directory).c_str());
        RemoveDirectoryW(folder.c_str());
        return S_OK;
    }
    if (!CreateDirectoryW(folder.c_str(), nullptr) && GetLastError() != ERROR_ALREADY_EXISTS) return HRESULT_FROM_WIN32(GetLastError());
    for (const auto& file : files) {
        auto resource = FindResourceW(instance, MAKEINTRESOURCEW(file.resource), RT_RCDATA);
        if (!resource) return HRESULT_FROM_WIN32(ERROR_RESOURCE_NAME_NOT_FOUND);
        auto bytes = SizeofResource(instance, resource);
        auto data = LockResource(LoadResource(instance, resource));
        auto path = folder + L"\\" + file.name;
        // Do not rewrite identical DLLs that Frame Server may still have loaded.
        auto existing = CreateFileW(path.c_str(), GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, nullptr, OPEN_EXISTING, 0, nullptr);
        bool same = false;
        if (existing != INVALID_HANDLE_VALUE) {
            LARGE_INTEGER size{};
            if (GetFileSizeEx(existing, &size) && size.QuadPart == bytes) {
                std::vector<BYTE> content(bytes); DWORD read = 0;
                same = ReadFile(existing, content.data(), bytes, &read, nullptr) && read == bytes && memcmp(content.data(), data, bytes) == 0;
            }
            CloseHandle(existing);
        }
        if (same) continue;
        auto parent = path.substr(0,path.find_last_of(L"\\"));
        SHCreateDirectoryExW(nullptr,parent.c_str(),nullptr);
        auto output = CreateFileW(path.c_str(), GENERIC_WRITE, 0, nullptr, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
        if (output == INVALID_HANDLE_VALUE) return HRESULT_FROM_WIN32(GetLastError());
        DWORD written = 0; auto success = WriteFile(output, data, bytes, &written, nullptr); auto error = GetLastError(); CloseHandle(output);
        if (!success || written != bytes) return HRESULT_FROM_WIN32(error ? error : ERROR_WRITE_FAULT);
    }
    auto hr = ExportRegistration(folder + L"\\ExtrudaCamera-0.3.dll", false); if (FAILED(hr)) return hr;
    // Retire only our previous 0.2 COM registration after the new one succeeds.
    RegDeleteTreeW(HKEY_LOCAL_MACHINE, L"Software\\Classes\\CLSID\\{B012D424-7399-44E3-B194-8213BF7785AC}");
    ComPtr<IShellLinkW> link; hr = CoCreateInstance(CLSID_ShellLink, nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&link));
    if (FAILED(hr)) return hr;
    link->SetPath((folder + L"\\ExtrudaCamera.exe").c_str()); link->SetWorkingDirectory(folder.c_str());
    link->SetDescription(L"Telefon som Windows-webcam uden OBS");
    ComPtr<IPersistFile> persisted; link.As(&persisted); return persisted->Save(shortcut.c_str(), TRUE);
}
int WINAPI wWinMain(HINSTANCE instance, HINSTANCE, PWSTR arguments, int) {
    const bool quiet = wcsstr(arguments, L"--quiet") != nullptr;
    const bool remove = wcsstr(arguments, L"--uninstall") != nullptr;
    CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
    auto hr = RunSetup(instance, remove);
    if (!quiet) {
        wchar_t message[512]{};
        if (SUCCEEDED(hr)) swprintf_s(message, remove ? L"Extruda Phone Camera er afinstalleret." : L"Installeret. Åbn Extruda Phone Camera fra Start-menuen som din almindelige Windows-bruger.");
        else swprintf_s(message, L"Installationen kunne ikke gennemføres. Luk Extruda-appen og prøv igen.\nFejlkode: 0x%08X", static_cast<unsigned>(hr));
        MessageBoxW(nullptr, message, L"Extruda Phone Camera Setup", MB_OK | (SUCCEEDED(hr) ? MB_ICONINFORMATION : MB_ICONERROR));
    }
    CoUninitialize(); return SUCCEEDED(hr) ? 0 : static_cast<int>(hr);
}
