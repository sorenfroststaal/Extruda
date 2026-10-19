# extruda Camera

Use an Android or iPhone camera as a Windows webcam, without OBS or a user account.

**[Download Windows installer 0.4.0](https://github.com/sorenfroststaal/Extruda/releases/download/camera-v0.4.0/ExtrudaCamera-Setup-0.4.0-x64.exe)** · [Releases](https://github.com/sorenfroststaal/Extruda/releases/tag/camera-v0.4.0) · [Camera website](https://extruda-phone-camera.sorenfroststaal.workers.dev/)

## Use

Windows 11 x64 and Microsoft Edge WebView2 Runtime are required. Run the installer,
open extruda Camera, and scan the QR code with your phone on the same Wi-Fi.
Compare the six-digit code on the two devices and accept on the PC. The phone
starts its camera after acceptance; grant camera permission if prompted.

The app starts at 1920 × 1080. Resolution controls appear once connected and
support 480p, 720p, 1080p, 1440p and 4K. Teams may need the camera reselected after
an output change. The phone and meeting app can deliver a lower actual resolution.

## Architecture

- The Windows UI is packaged locally. A native Media Foundation camera makes
  received video available to meeting programs.
- The phone client and temporary pairing service are hosted on Cloudflare.
  This version needs internet for loading/pairing; video travels directly via WebRTC.
- Pairing uses encrypted signalling, one-time tokens, a comparison code and
  cross-room rate limits. No microphone or video recording feature is included.
- A protected temporary file transports decoded frames to Windows Frame Server.

See [Windows build and installation](windows/README.md),
[validation](windows/VALIDATION.md), and [security review](SECURITY-REVIEW.md).
This is an unsigned prototype, not an independently audited production release.

## Build

Install Node.js and pnpm, then run `pnpm install --frozen-lockfile` and `pnpm build`.
See the Windows README for the C++ toolchain. `pnpm dev` starts the local Worker;
run `pnpm test` in another terminal. To deploy your own instance, update the
Cloudflare account and service URLs in the sources; no credentials are committed.

## Source and releases

This project lives in `software/camera` in the existing
[sorenfroststaal/Extruda repository](https://github.com/sorenfroststaal/Extruda/tree/main/software/camera).
Installers and the Windows ZIP are GitHub Release assets, outside Git history.
Previous Cloudflare download URLs redirect to GitHub for compatibility.

## Licences

Code: MIT; upstream camera source and SDK notices accompany distributions.
Fonts carry their OFL licences. Brand assets are covered separately by
[BRAND-NOTICE.txt](BRAND-NOTICE.txt).
