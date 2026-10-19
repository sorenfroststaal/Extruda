#include "pch.h"
#include "FrameGenerator.h"
#include <algorithm>
FrameGenerator::~FrameGenerator() {
    if (_view) UnmapViewOfFile(_view);
    if (_mapping) CloseHandle(_mapping);
    if (_file != INVALID_HANDLE_VALUE) CloseHandle(_file);
    if (_mutex) CloseHandle(_mutex);
}
bool FrameGenerator::Open() {
    if (_view) return true;
    if (_path.empty()) return false;
    wchar_t data[MAX_PATH]{};
    if (!GetEnvironmentVariableW(L"ProgramData", data, MAX_PATH)) return false;
    const std::wstring prefix = std::wstring(data) + L"\\ExtrudaPhoneCamera\\";
    if (_path.compare(0, prefix.size(), prefix) != 0 || _path.find(L"..") != std::wstring::npos || _path.find(L':', 2) != std::wstring::npos) return false;
    auto mutex = OpenMutexW(SYNCHRONIZE | MUTEX_MODIFY_STATE, FALSE, FrameMutexName(_path).c_str());
    if (!mutex) return false;
    auto file = CreateFileW(_path.c_str(), GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
    LARGE_INTEGER size{};
    if (file == INVALID_HANDLE_VALUE || !GetFileSizeEx(file, &size) || size.QuadPart != FrameFileBytes) { if (file != INVALID_HANDLE_VALUE) CloseHandle(file); CloseHandle(mutex); return false; }
    auto mapping = CreateFileMappingW(file, nullptr, PAGE_READONLY, 0, 0, nullptr);
    auto view = mapping ? static_cast<const FrameHeader*>(MapViewOfFile(mapping, FILE_MAP_READ, 0, 0, FrameFileBytes)) : nullptr;
    if (!view) { if (mapping) CloseHandle(mapping); CloseHandle(file); CloseHandle(mutex); return false; }
    _file = file; _mapping = mapping; _view = view; _mutex = mutex;
    return true;
}
static BYTE Clamp(int value) { return static_cast<BYTE>(std::clamp(value, 0, 255)); }
HRESULT FrameGenerator::Generate(IMFSample* sample, REFGUID format, IMFSample** outSample) {
    RETURN_HR_IF_NULL(E_POINTER, sample);
    RETURN_HR_IF_NULL(E_POINTER, outSample);
    *outSample = nullptr;
    bool fresh = false;
    if (Open()) {
        auto result = WaitForSingleObject(_mutex, 10);
        if (result == WAIT_OBJECT_0 || result == WAIT_ABANDONED) {
            const auto now = GetTickCount64();
            if (_view->magic == FrameMagic && _view->version == 2 && _view->width == _width && _view->height == _height && _view->updated && now >= _view->updated && now - _view->updated < 2000) {
                memcpy(_pixels.data(), reinterpret_cast<const BYTE*>(_view) + sizeof(FrameHeader), _pixels.size());
                fresh = true;
            }
            ReleaseMutex(_mutex);
        }
    }
    if (!fresh) std::fill(_pixels.begin(), _pixels.end(), 0);
    const bool nv12 = format == MFVideoFormat_NV12;
    RETURN_HR_IF(MF_E_INVALIDMEDIATYPE, !nv12 && format != MFVideoFormat_RGB32);
    const DWORD size = nv12 ? _width * _height * 3 / 2 : _width * _height * 4;
    wil::com_ptr_nothrow<IMFMediaBuffer> buffer;
    RETURN_IF_FAILED(MFCreateMemoryBuffer(size, &buffer));
    BYTE* target = nullptr;
    RETURN_IF_FAILED(buffer->Lock(&target, nullptr, nullptr));
    if (!nv12) memcpy(target, _pixels.data(), _pixels.size());
    else {
        for (unsigned y = 0; y < _height; ++y) for (unsigned x = 0; x < _width; ++x) {
            const BYTE* p = &_pixels[(y * _width + x) * 4];
            target[y * _width + x] = Clamp(((66 * p[2] + 129 * p[1] + 25 * p[0] + 128) >> 8) + 16);
        }
        BYTE* uv = target + _width * _height;
        for (unsigned y = 0; y < _height; y += 2) for (unsigned x = 0; x < _width; x += 2) {
            int r = 0, g = 0, b = 0;
            for (unsigned dy = 0; dy < 2; ++dy) for (unsigned dx = 0; dx < 2; ++dx) { const BYTE* p = &_pixels[((y + dy) * _width + x + dx) * 4]; b += p[0]; g += p[1]; r += p[2]; }
            r /= 4; g /= 4; b /= 4;
            uv[(y / 2) * _width + x] = Clamp(((-38 * r - 74 * g + 112 * b + 128) >> 8) + 128);
            uv[(y / 2) * _width + x + 1] = Clamp(((112 * r - 94 * g - 18 * b + 128) >> 8) + 128);
        }
    }
    buffer->Unlock();
    RETURN_IF_FAILED(buffer->SetCurrentLength(size));
    RETURN_IF_FAILED(sample->RemoveAllBuffers());
    RETURN_IF_FAILED(sample->AddBuffer(buffer.get()));
    sample->AddRef(); *outSample = sample;
    return S_OK;
}
