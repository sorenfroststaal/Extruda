#pragma once
#include "../FrameTransport.h"
#include <sddl.h>
#include <vector>
#include <stdexcept>
#include <wrl/client.h>
class FrameWriter {
    HANDLE file = INVALID_HANDLE_VALUE, mapping = nullptr, mutex = nullptr;
    FrameHeader* view = nullptr;
public:
    std::wstring path;
    unsigned width, height;
    FrameWriter(unsigned w = FrameWidth, unsigned h = FrameHeight) : width(w), height(h) {
        if (!SupportedSize(w, h)) throw std::runtime_error("Unsupported frame size");
        wchar_t data[MAX_PATH]{}; GetEnvironmentVariableW(L"ProgramData", data, MAX_PATH);
        std::wstring directory = std::wstring(data) + L"\\ExtrudaPhoneCamera";
        if (!CreateDirectoryW(directory.c_str(), nullptr) && GetLastError() != ERROR_ALREADY_EXISTS) throw std::runtime_error("Cannot create frame directory");
        HANDLE token = nullptr;
        if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &token)) throw std::runtime_error("Cannot read user SID");
        DWORD size = 0; GetTokenInformation(token, TokenUser, nullptr, 0, &size);
        std::vector<BYTE> info(size);
        if (!GetTokenInformation(token, TokenUser, info.data(), size, &size)) { CloseHandle(token); throw std::runtime_error("Cannot read user SID"); }
        CloseHandle(token);
        LPWSTR sid = nullptr;
        if (!ConvertSidToStringSidW(reinterpret_cast<TOKEN_USER*>(info.data())->User.Sid, &sid)) throw std::runtime_error("Cannot format SID");
        std::wstring fileSddl = L"D:P(A;;GA;;;SY)(A;;GR;;;LS)(A;;GA;;;" + std::wstring(sid) + L")";
        std::wstring mutexSddl = L"D:P(A;;GA;;;SY)(A;;0x00100001;;;LS)(A;;GA;;;" + std::wstring(sid) + L")";
        LocalFree(sid);
        PSECURITY_DESCRIPTOR fileSd = nullptr, mutexSd = nullptr;
        if (!ConvertStringSecurityDescriptorToSecurityDescriptorW(fileSddl.c_str(), SDDL_REVISION_1, &fileSd, nullptr) || !ConvertStringSecurityDescriptorToSecurityDescriptorW(mutexSddl.c_str(), SDDL_REVISION_1, &mutexSd, nullptr)) throw std::runtime_error("Cannot secure frame transport");
        SECURITY_ATTRIBUTES fileSa{sizeof(fileSa), fileSd, FALSE}, mutexSa{sizeof(mutexSa), mutexSd, FALSE};
        GUID id{}; CoCreateGuid(&id); wchar_t name[40]{}; StringFromGUID2(id, name, 40);
        path = directory + L"\\" + name + L".frame";
        mutex = CreateMutexW(&mutexSa, FALSE, FrameMutexName(path).c_str());
        file = CreateFileW(path.c_str(), GENERIC_READ | GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_DELETE, &fileSa, CREATE_NEW, FILE_ATTRIBUTE_TEMPORARY | FILE_FLAG_DELETE_ON_CLOSE, nullptr);
        LocalFree(fileSd); LocalFree(mutexSd);
        if (!mutex || file == INVALID_HANDLE_VALUE) throw std::runtime_error("Cannot create secure frame transport");
        LARGE_INTEGER bytes{}; bytes.QuadPart = FrameFileBytes;
        if (!SetFilePointerEx(file, bytes, nullptr, FILE_BEGIN) || !SetEndOfFile(file)) throw std::runtime_error("Cannot size frame transport");
        mapping = CreateFileMappingW(file, nullptr, PAGE_READWRITE, 0, static_cast<DWORD>(FrameFileBytes), nullptr);
        view = mapping ? static_cast<FrameHeader*>(MapViewOfFile(mapping, FILE_MAP_WRITE, 0, 0, FrameFileBytes)) : nullptr;
        if (!view) throw std::runtime_error("Cannot map frame transport");
        ZeroMemory(view, FrameFileBytes); view->magic = FrameMagic; view->version = 2; view->width = width; view->height = height;
    }
    FrameWriter(const FrameWriter&) = delete;
    ~FrameWriter() {
        Clear();
        if (view) UnmapViewOfFile(view);
        if (mapping) CloseHandle(mapping);
        if (file != INVALID_HANDLE_VALUE) CloseHandle(file);
        if (mutex) CloseHandle(mutex);
    }
    void Clear() { if (view && mutex) { auto result = WaitForSingleObject(mutex, 100); if (result == WAIT_OBJECT_0 || result == WAIT_ABANDONED) { view->updated = 0; ZeroMemory(reinterpret_cast<BYTE*>(view) + sizeof(FrameHeader), MaxFrameBytes); ReleaseMutex(mutex); } } }
    bool Write(const BYTE* bgra) {
        auto result = WaitForSingleObject(mutex, 10);
        if (result != WAIT_OBJECT_0 && result != WAIT_ABANDONED) return false;
        memcpy(reinterpret_cast<BYTE*>(view) + sizeof(FrameHeader), bgra, width * height * 4);
        view->updated = GetTickCount64(); ReleaseMutex(mutex); return true;
    }
};
