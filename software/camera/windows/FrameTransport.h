#pragma once
#include <windows.h>
#include <stdint.h>
#include <string>
inline constexpr unsigned FrameWidth = 1280, FrameHeight = 720;
inline constexpr unsigned FrameBytes = FrameWidth * FrameHeight * 4;
inline constexpr unsigned MaxFrameBytes = 3840 * 2160 * 4;
inline bool SupportedSize(unsigned w, unsigned h) {
    return (w == 640 && h == 480) || (w == 1280 && h == 720) || (w == 1920 && h == 1080) || (w == 2560 && h == 1440) || (w == 3840 && h == 2160);
}
inline constexpr uint32_t FrameMagic = 0x45584341;
inline constexpr wchar_t CameraClassId[] = L"{B012D425-7399-44E3-B194-8213BF7785AC}";
inline constexpr GUID FramePathAttribute = {0xf1343209,0x1cce,0x45af,{0xb5,0x58,0x2d,0x42,0x75,0x51,0x3a,0xd0}};
inline constexpr GUID FrameSizeAttribute = {0x2de071ab,0x3f39,0x455a,{0xb8,0x80,0x41,0x91,0x3d,0x17,0x84,0x05}};
struct alignas(64) FrameHeader {
    uint32_t magic, version, width, height;
    uint64_t updated;
    uint32_t reserved[10];
};
static_assert(sizeof(FrameHeader) == 64);
inline constexpr size_t FrameFileBytes = sizeof(FrameHeader) + MaxFrameBytes;
inline std::wstring FrameMutexName(const std::wstring& path) {
    auto offset = path.find_last_of(L"\\/");
    return L"Global\\ExtrudaCamera-" + path.substr(offset == std::wstring::npos ? 0 : offset + 1);
}
