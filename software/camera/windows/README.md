# Security revision 0.4.0

The Windows interface is packaged locally. Compare the six-digit code on the phone and PC before accepting. No user account is required. The protected temporary frame file remains; releases are unsigned.

# extruda Camera for Windows — prototype 0.4

Windows 11 x64 receiver with its own Media Foundation virtual camera. No OBS.
Microsoft Edge WebView2 Runtime is required (normally present on Windows 11).

Installed and validated on Windows 11 build 26200 on 19 October 2026. The
complete receiver-to-OS-camera chain delivered 30 consecutive correct synthetic
video frames to a separate Media Foundation webcam client, without OBS.
See VALIDATION.md in the source tree for the precise verification scope.

## Install and use

1. Extract the complete ZIP into a local folder.
2. Run **ExtrudaSetup.exe** and approve Windows' administrator dialog. It copies
   the app and camera DLL into Program Files, registers this one COM class in
   HKLM, and adds a Start menu shortcut. No kernel driver or Windows service is
   installed. PowerShell execution policy is not changed or required.
3. Open extruda Camera from Start as your normal Windows user. The app starts
   at 1920 × 1080 and automatically shows a QR code.
4. Scan the QR on the same Wi-Fi, compare the six-digit code and accept on the PC.
   The phone starts its camera automatically; grant camera permission if prompted.
   Resolution can be changed after video connects, without a new pairing.
5. In the meeting program select **Extruda Phone Camera Windows Virtual Camera**.
   Restart the meeting program if the new camera is not in its list.
6. Keep the receiver app open. Closing it removes the session camera. Stop on
   the phone clears the output; a stalled receiver goes black after 2 seconds.

This is an unsigned development build, not a signed production installer.
Compatibility with individual meeting programs and real Android/iOS devices
must be checked. No microphone, background capture or audio device is included.

The phone is asked for the chosen resolution, but may deliver a smaller image.
The app reports both actual phone capture size and configured Windows output.
Teams may further reduce resolution. High output resolution alone does not
create additional detail. 1440p/4K need more CPU, memory and bandwidth; 30 fps
is a target, not a guarantee. 1080p is the startup resolution.

Uninstall: close the app, then run `ExtrudaSetup.exe --uninstall`. This unregisters
the application's own camera COM class and removes its known installed files.
Use the native installer for installation and removal.

## Architecture and security

The app uses WebView2 to receive the existing encrypted WebRTC connection from
the locally packaged HTTPS virtual-host UI, using Cloudflare only for pairing. A local embedded script draws the decoded video into
a canvas at the selected output size. WebView2 shared buffers transfer BGRA pixels without JPEG or
base64 encoding. A handshake allows only one frame in flight. Aspect ratio is
preserved with black bars. Output is RGB32/NV12 with 30 fps timestamps, repeating the last
received frame when necessary.

The media source is a user-mode COM DLL based on Simon Mourier's MIT-licensed
VCamSample, pinned at 58b6d4b0e0c2c97fdffd66d23e7c8da6b89f570d. Modified:
frame generator, asynchronous pacing, stream-state typo, correct NV12 stride,
activation-time attribute copying, resolution, COM class ID, and CPU samples
that retain their original timing attributes. The upstream license accompanies
all binary/source distributions. Microsoft WebView2 uses its own SDK license.

Navigations and native bridge messages are restricted to the exact local app origin.
Popups and desktop camera/microphone permissions are denied. The receiver does
not need access to the PC's physical cameras. The native bridge accepts only
fixed message strings and a fixed-size pixel buffer, not paths or commands.

Frames use a temporary, randomly named file mapping in ProgramData. Its ACL
allows only the current user, SYSTEM, and read access for Local Service (Windows
Camera Frame Server). A similarly restricted global mutex protects copies.
There is no network frame listener. The media source validates directory, file
size, protocol version, geometry and timestamp. Files delete when all handles
close. Frames are never deliberately saved as a recording; paging is OS-managed.

The app currently loads its UI from our HTTPS service, so a compromised deployment
could change the page. Native navigation/message restrictions limit the exposed
API to sending webcam pixels, but bundling the UI locally is a future hardening step.

## Build

Visual Studio 2022 C++ tools plus Windows SDK 10.0.26100.0; x64. Set VSDEVCMD if
VsDevCmd.bat is somewhere other than C:\BuildToolsExtruda.

Run `windows\prepare.ps1` to download the pinned official NuGet packages and
verify their SHA-256 checksums into .tools (not source-controlled):

- Microsoft.Web.WebView2 1.0.3537.50 → .tools/webview2
- Microsoft.Windows.ImplementationLibrary 1.0.260126.7 → .tools/wil
- Microsoft.Windows.CppWinRT 3.0.260818.1 → .tools/cppwinrt

From the repository root run `windows\build.cmd`. Output is windows/dist.
Run CameraTests.exe from that directory to test the actual media source through
Media Foundation Source Reader without installing or registering a camera.
`CameraTests.exe --enumerate` lists OS camera devices without capturing them.
