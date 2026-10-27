# Extruda logo animation — final master

Approved motion: Midtpunkt (alternative 4). Approved clean, octave-raised intro.
Duration: 3.6 seconds. Frame rate: 50 fps. Thickness click: 3.1 seconds.

## Files

- `extruda-logo-{light,dark,bw,black}-4k.mp4`: 3840 × 1536, H.264, AAC 320 kbps.
- `extruda-logo-{light,dark,bw,black}-web.webm`: 1920 × 768, VP9, Opus 192 kbps.
- `extruda-logo-{light,dark,bw,black}-poster.png`: 3840 × 1536 still image.
- `extruda-logo-{light,dark,bw,black}-poster.svg`: scalable still image.
- `extruda-logo-audio.wav`: 48 kHz stereo, 16-bit PCM, lossless approved audio.
- `extruda-logo-animation.zip`: complete delivery, including source and this guide.

Light uses original colours on #F5F0E8. Dark uses a white logo on #252C2C,
as specified by the design system. Black/white uses black on white. The black version uses white on pure #000000.
These four background versions are opaque. The transparent version below has true alpha.
No audio is included in the still images. No GIF is included because GIF
cannot carry the approved sound.

## Usage

Use a native video player with controls and playsinline. Do not autoplay
with sound. Use the matching SVG/PNG poster as the reduced-motion alternative.
UI theme does not alter the downloaded files: choose the required variant.
MP4 is the broadly compatible delivery; WebM is the lighter web delivery.
WAV is supplied separately for editing without lossy audio re-encoding.
The website loads media only after an explicit play action; no account,
camera, microphone or third-party playback service is required.

## Rebuild

Requires Node.js, the sharp package and FFmpeg with libx264, libvpx-vp9,
AAC and libopus support. These are development/export dependencies only.
No network call is made by the exporter. Set FFMPEG_PATH to FFmpeg, make
sharp available to Node.js, then run `node source/export.cjs` from this folder.
Missing dependencies stop the export with an error; existing files are usable.
The renderer reads the original SVG from ../../../Assets/Brand relative to
its source folder within the repository. For the stand-alone ZIP it uses
source/original-logo.svg instead.

All geometry is rendered from vectors at delivery resolution, not upscaled
from the review video. The original 1200 × 480 framing is retained at 3.2×.
Original final logo geometry, motion, frame rate, duration and click timing
are retained. Audio is taken from the approved clean synthesis.

## Transparent overlay version

- `extruda-logo-transparent-4k.mov`: 3840 × 1536, 50 fps, ProRes 4444 with
  16-bit encoded alpha, 48 kHz stereo PCM audio. Use in an editor supporting
  ProRes 4444 alpha. Set compositing/alpha interpretation to straight if needed.
- `extruda-logo-transparent-web.webm`: 1920 × 768, 50 fps, VP9 alpha and Opus.
  WebM transparency is browser-dependent; a decoder ignoring alpha may show
  a black rectangle. The browser preview was checked in Chrome.
- `extruda-logo-transparent-poster.{png,svg}`: transparent still images.

Original logo colours and graphite wordmark are retained. These are intended
for light or medium backgrounds; contrast depends on the image underneath.
The checkerboard on the website is only a CSS preview and is not encoded.
Motion, framing, 3.6-second duration and 3.1-second click are unchanged.
MOV's PCM samples are identical to the approved WAV. No green-screen removal
or background colour key is used. MP4/H.264 is not provided for this variant
because the existing delivery codec does not retain an alpha channel.

Rebuild using `node source/export-transparent.cjs` with the same local
requirements, plus FFmpeg prores_ks and VP9 alpha encoding support.
