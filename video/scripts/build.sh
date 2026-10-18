#!/usr/bin/env bash
# Renders the Remotion composition, scores it with ffmpeg and writes the final
# web-ready MP4 + poster frame into ../assets.
#
#   npm install && npm run render
#
# Set REMOTION_BROWSER to a Chrome/Chromium headless shell to skip Remotion's
# own browser download (e.g. in sandboxes without internet access).
# The video ships silent; set SOUNDTRACK=1 to mix in scripts/soundtrack.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out ../assets

BROWSER_FLAG=()
[[ -n "${REMOTION_BROWSER:-}" ]] && BROWSER_FLAG=(--browser-executable="$REMOTION_BROWSER")

npx remotion render src/index.ts FaultlineDemo out/silent.mp4 \
  --codec=h264 --crf=14 --muted "${BROWSER_FLAG[@]}"

AUDIO_IN=()
AUDIO_OUT=(-an)
if [[ "${SOUNDTRACK:-0}" == 1 ]]; then
  bash scripts/soundtrack.sh out/soundtrack.wav
  AUDIO_IN=(-i out/soundtrack.wav)
  AUDIO_OUT=(-map 0:v -map 1:a -c:a aac -b:a 192k)
fi

# Final encode: H.264 High, yuv420p, faststart so it streams before fully downloaded.
ffmpeg -y -loglevel error -i out/silent.mp4 "${AUDIO_IN[@]}" \
  -c:v libx264 -preset slow -crf 20 -profile:v high -pix_fmt yuv420p -tune animation \
  "${AUDIO_OUT[@]}" \
  -movflags +faststart -t 60 \
  ../assets/faultline-demo.mp4

# Poster frame (the logo reveal) for README / LinkedIn thumbnails.
ffmpeg -y -loglevel error -ss 6.2 -i ../assets/faultline-demo.mp4 -frames:v 1 -q:v 2 ../assets/faultline-demo-poster.jpg

ffprobe -v error -show_entries format=duration,size -of default=nw=1 ../assets/faultline-demo.mp4
