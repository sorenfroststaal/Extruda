#include <windows.h>
#include <mfapi.h>
#include <mfidl.h>
#include <mfreadwrite.h>
#include <mfvirtualcamera.h>
#include <wrl.h>
#include <stdio.h>
#include <vector>
#include "../app/FrameWriter.h"
using namespace Microsoft::WRL;
void Check(HRESULT hr, const char* label) { if (FAILED(hr)) { printf("FAIL %s: 0x%08X\n", label, static_cast<unsigned>(hr)); exit(1); } }
void Expect(bool value, const char* label) { if (!value) { printf("FAIL %s\n", label); exit(1); } }
ComPtr<IMFSample> ReadNext(IMFSourceReader* reader, LONGLONG* timestamp = nullptr) {
    for (unsigned attempt = 0; attempt < 120; ++attempt) {
        DWORD flags = 0; ComPtr<IMFSample> sample;
        Check(reader->ReadSample(MF_SOURCE_READER_FIRST_VIDEO_STREAM, 0, nullptr, &flags, timestamp, &sample), "read frame");
        Expect((flags & (MF_SOURCE_READERF_ERROR | MF_SOURCE_READERF_ENDOFSTREAM)) == 0, "source reader status");
        if (sample) return sample;
    }
    Expect(false, "timely sample after stream events"); return {};
}
ComPtr<IMFMediaSource> CreateSource(const std::wstring& framePath, unsigned width, unsigned height) {
    auto dll = LoadLibraryW(L"ExtrudaCamera.dll"); Expect(dll != nullptr, "load camera DLL");
    auto getClass = reinterpret_cast<HRESULT(WINAPI*)(REFCLSID, REFIID, void**)>(GetProcAddress(dll, "DllGetClassObject")); Expect(getClass != nullptr, "COM factory export");
    GUID id{}; CLSIDFromString(CameraClassId, &id);
    ComPtr<IClassFactory> factory; Check(getClass(id, IID_PPV_ARGS(&factory)), "get factory");
    ComPtr<IMFActivate> activate; Check(factory->CreateInstance(nullptr, IID_PPV_ARGS(&activate)), "create activation object");
    Check(activate->SetString(FramePathAttribute, framePath.c_str()), "set frame path");
    Check(activate->SetUINT64(FrameSizeAttribute, (static_cast<UINT64>(width) << 32) | height), "set output size");
    ComPtr<IMFMediaSource> source; Check(activate->ActivateObject(IID_PPV_ARGS(&source)), "activate media source");
    return source;
}
void ReaderTest(FrameWriter& writer, bool nv12, IMFMediaSource* installed = nullptr) {
    ComPtr<IMFMediaSource> source = installed;
    const auto width = writer.width, height = writer.height, bytes = width * height * 4;
    if (!source) source = CreateSource(writer.path, width, height);
    ComPtr<IMFSourceReader> reader; Check(MFCreateSourceReaderFromMediaSource(source.Get(), nullptr, &reader), "create source reader");
    ComPtr<IMFMediaType> type; Check(MFCreateMediaType(&type), "create type");
    type->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Video); type->SetGUID(MF_MT_SUBTYPE, nv12 ? MFVideoFormat_NV12 : MFVideoFormat_RGB32);
    MFSetAttributeSize(type.Get(), MF_MT_FRAME_SIZE, width, height); MFSetAttributeRatio(type.Get(), MF_MT_FRAME_RATE, 30, 1);
    Check(reader->SetCurrentMediaType(MF_SOURCE_READER_FIRST_VIDEO_STREAM, nullptr, type.Get()), "select 720p media type");
    std::vector<BYTE> pixels(bytes); for (unsigned i = 0; i < bytes; i += 4) { pixels[i] = 20; pixels[i+1] = 80; pixels[i+2] = 200; pixels[i+3] = 255; }
    writer.Write(pixels.data());
    LONGLONG previous = -1; auto start = GetTickCount64();
    for (int i = 0; i < 30; ++i) {
        writer.Write(pixels.data());
        LONGLONG timestamp = 0; auto sample = ReadNext(reader.Get(), &timestamp);
        Expect(sample != nullptr, "nonempty sample"); Expect(timestamp > previous, "monotonic timestamps"); previous = timestamp;
        LONGLONG duration = 0; Check(sample->GetSampleDuration(&duration), "sample duration"); Expect(duration == 333333, "30 fps duration");
        ComPtr<IMFMediaBuffer> buffer; Check(sample->ConvertToContiguousBuffer(&buffer), "sample memory"); BYTE* p = nullptr; DWORD size = 0; Check(buffer->Lock(&p, nullptr, &size), "lock sample");
        Expect(size == (nv12 ? width * height * 3/2 : bytes), "sample byte size");
        if (nv12) { Expect(p[0] == 110 && p[width * height] == 84 && p[width * height + 1] == 185, "NV12 color values"); }
        else Expect(p[0] == 20 && p[1] == 80 && p[2] == 200, "BGRA channel order");
        buffer->Unlock();
    }
    auto elapsed = GetTickCount64() - start; Expect(elapsed >= 700 && elapsed < 15000, "bounded frame pacing");
    // Do not keep publishing an old camera image after a stalled receiver.
    Sleep(2100);
    for (int i = 0; i < 6; ++i) {
        auto sample = ReadNext(reader.Get());
        if (i == 5) { ComPtr<IMFMediaBuffer> buffer; sample->ConvertToContiguousBuffer(&buffer); BYTE* p = nullptr; buffer->Lock(&p, nullptr, nullptr); Expect(p[0] == (nv12 ? 16 : 0), "black frame after stalled producer"); buffer->Unlock(); }
    }
    writer.Clear();
    for (int i = 0; i < 6; ++i) {
        auto sample = ReadNext(reader.Get());
        if (i == 5) { ComPtr<IMFMediaBuffer> buffer; sample->ConvertToContiguousBuffer(&buffer); BYTE* p = nullptr; buffer->Lock(&p, nullptr, nullptr); Expect(p[0] == (nv12 ? 16 : 0), "black frame after stop"); buffer->Unlock(); }
    }
    reader.Reset();
    printf("PASS %ux%u %s: 30 frames in %llu ms, correct pixels, timestamps, stop/stale blackout\n", width, height, nv12 ? "NV12" : "RGB32", elapsed);
}
int wmain(int argc, wchar_t** argv) {
    CoInitializeEx(nullptr, COINIT_MULTITHREADED); MFStartup(MF_VERSION);
    unsigned requestedWidth = FrameWidth, requestedHeight = FrameHeight;
    if (argc > 2) Expect(swscanf_s(argv[2], L"%ux%u", &requestedWidth, &requestedHeight) == 2 && SupportedSize(requestedWidth, requestedHeight), "valid requested test size");
    if (argc > 1 && !wcscmp(argv[1], L"--probe")) {
        ComPtr<IMFAttributes> attributes; MFCreateAttributes(&attributes, 1); attributes->SetGUID(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE, MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_GUID);
        IMFActivate** devices = nullptr; UINT32 count = 0; Check(MFEnumDeviceSources(attributes.Get(), &devices, &count), "enumerate running camera");
        ComPtr<IMFMediaSource> source;
        for (UINT32 i = 0; i < count; ++i) { wchar_t name[512]{}; devices[i]->GetString(MF_DEVSOURCE_ATTRIBUTE_FRIENDLY_NAME, name, 512, nullptr); if (wcsstr(name, L"Extruda Phone Camera")) Check(devices[i]->ActivateObject(IID_PPV_ARGS(&source)), "activate running camera"); devices[i]->Release(); }
        CoTaskMemFree(devices); Expect(source != nullptr, "Extruda camera is listed by Windows");
        ComPtr<IMFSourceReader> reader; Check(MFCreateSourceReaderFromMediaSource(source.Get(), nullptr, &reader), "open running camera");
        ComPtr<IMFMediaType> type; MFCreateMediaType(&type); type->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Video); type->SetGUID(MF_MT_SUBTYPE, MFVideoFormat_RGB32); MFSetAttributeSize(type.Get(), MF_MT_FRAME_SIZE, requestedWidth, requestedHeight);
        Check(reader->SetCurrentMediaType(MF_SOURCE_READER_FIRST_VIDEO_STREAM, nullptr, type.Get()), "running camera RGB32");
        unsigned matching = 0;
        for (unsigned attempt = 0; attempt < 300 && matching < 30; ++attempt) {
            auto sample = ReadNext(reader.Get()); ComPtr<IMFMediaBuffer> buffer; sample->ConvertToContiguousBuffer(&buffer); BYTE* p = nullptr; DWORD size = 0; buffer->Lock(&p, nullptr, &size);
            if (size == requestedWidth * requestedHeight * 4 && p[0] == 20 && p[1] == 80 && p[2] == 200) ++matching;
            else matching = 0;
            buffer->Unlock();
        }
        Expect(matching == 30, "30 correct frames from WebView2 through OS camera");
        puts("PASS complete app: WebView2 video -> shared buffer -> secured frame transport -> Windows Frame Server -> webcam client (30 frames).");
        return 0;
    }
    if (argc > 1 && !wcscmp(argv[1], L"--enumerate")) {
        ComPtr<IMFAttributes> attributes; MFCreateAttributes(&attributes, 1); attributes->SetGUID(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE, MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_GUID);
        IMFActivate** devices = nullptr; UINT32 count = 0; Check(MFEnumDeviceSources(attributes.Get(), &devices, &count), "enumerate cameras");
        for (UINT32 i = 0; i < count; ++i) { wchar_t name[512]{}; devices[i]->GetString(MF_DEVSOURCE_ATTRIBUTE_FRIENDLY_NAME, name, 512, nullptr); wprintf(L"%s\n", name); devices[i]->Release(); } CoTaskMemFree(devices); return 0;
    }
    FrameWriter writer(requestedWidth, requestedHeight);
    if (argc > 1 && !wcscmp(argv[1], L"--system")) {
        ComPtr<IMFVirtualCamera> camera;
        Check(MFCreateVirtualCamera(MFVirtualCameraType_SoftwareCameraSource, MFVirtualCameraLifetime_Session, MFVirtualCameraAccess_CurrentUser, L"Extruda Phone Camera", CameraClassId, nullptr, 0, &camera), "create OS virtual camera");
        Check(camera->SetString(FramePathAttribute, writer.path.c_str()), "configure OS frame transport");
        Check(camera->SetUINT64(FrameSizeAttribute, (static_cast<UINT64>(requestedWidth) << 32) | requestedHeight), "configure OS output size");
        Check(camera->Start(nullptr), "start OS virtual camera");
        wchar_t symbolic[2048]{};
        Check(camera->GetString(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_SYMBOLIC_LINK, symbolic, 2048, nullptr), "camera symbolic link");
        ComPtr<IMFAttributes> attributes; MFCreateAttributes(&attributes, 2);
        attributes->SetGUID(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE, MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_GUID);
        attributes->SetString(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_SYMBOLIC_LINK, symbolic);
        ComPtr<IMFMediaSource> source;
        Check(MFCreateDeviceSource(attributes.Get(), &source), "open OS camera through Frame Server");
        ReaderTest(writer, false, source.Get());
        source.Reset(); camera->Stop(); camera->Shutdown(); camera.Reset();
        puts("PASS OS camera: device registration, Frame Server, secured cross-process pixels, stop/stale blackout.");
        return 0;
    }
    for (const auto size : {std::pair<unsigned,unsigned>{640,480},{1280,720},{1920,1080},{2560,1440},{3840,2160}}) {
        FrameWriter sized(size.first, size.second); ReaderTest(sized, false); ReaderTest(sized, true);
    }
    MFShutdown(); CoUninitialize(); puts("All native camera tests passed."); return 0;
}
