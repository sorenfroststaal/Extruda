#pragma once
#include "../FrameTransport.h"
#include <vector>
class FrameGenerator {
    std::wstring _path;
    HANDLE _file = INVALID_HANDLE_VALUE, _mapping = nullptr, _mutex = nullptr;
    const FrameHeader* _view = nullptr;
    std::vector<BYTE> _pixels = std::vector<BYTE>(FrameBytes);
    bool Open();
    unsigned _width = FrameWidth, _height = FrameHeight;
public:
    ~FrameGenerator();
    void SetFramePath(std::wstring path) { _path = std::move(path); }
    HRESULT SetD3DManager(IUnknown*, UINT, UINT) { return S_OK; }
    HRESULT EnsureRenderTarget(UINT width, UINT height) { if (!SupportedSize(width, height)) return E_INVALIDARG; _width = width; _height = height; _pixels.resize(width * height * 4); return S_OK; }
    HRESULT Generate(IMFSample* sample, REFGUID format, IMFSample** outSample);
};
