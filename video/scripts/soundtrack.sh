#!/usr/bin/env bash
# Synthesises the 60 s soundtrack with ffmpeg alone (no samples, no licensing).
# Hit times are in seconds and line up with the scene timeline in src/Root.tsx:
#   transitions  -> whooshes
#   crack/glitch -> sub-bass impacts
set -euo pipefail
OUT=${1:-out/soundtrack.wav}
D=60
SR=48000

WHOOSH_AT=(4.5 9 16.5 27 38.5 47 51.5)
IMPACT_AT=(0.07 3.2 5.1 25.23 51.97)
BEAT_FROM=9
BEAT_TO=56
BEAT=0.5357   # 112 BPM

# Sum of Gaussian swells peaking slightly after each cut.
whoosh_env=$(printf '+exp(-pow((t-%s)/0.16,2))' "${WHOOSH_AT[@]}")
whoosh_env=${whoosh_env#+}

# Pitch-dropping sine boom, one per impact.
impact=""
for T in "${IMPACT_AT[@]}"; do
  impact+="+if(gte(t,$T),sin(2*PI*(38+70*exp(-(t-$T)*9))*(t-$T))*exp(-(t-$T)*2.6),0)"
done
impact=${impact#+}

ffmpeg -y -loglevel error \
  -f lavfi -i "aevalsrc='(sin(2*PI*55*t)+0.55*sin(2*PI*82.41*t)+0.45*sin(2*PI*110.3*t)+0.25*sin(2*PI*164.81*t)+0.12*sin(2*PI*220.6*t))*(0.65+0.35*sin(2*PI*0.08*t))':s=$SR:d=$D" \
  -f lavfi -i "aevalsrc='if(between(t,$BEAT_FROM,$BEAT_TO),sin(2*PI*(46+95*exp(-mod(t,$BEAT)*38))*mod(t,$BEAT))*exp(-mod(t,$BEAT)*8),0)':s=$SR:d=$D" \
  -f lavfi -i "aevalsrc='if(between(t,$BEAT_FROM,$BEAT_TO),(random(0)*2-1)*exp(-mod(t+$BEAT/2,$BEAT)*55),0)':s=$SR:d=$D" \
  -f lavfi -i "aevalsrc='(random(1)*2-1)*($whoosh_env)':s=$SR:d=$D" \
  -f lavfi -i "aevalsrc='$impact':s=$SR:d=$D" \
  -filter_complex "
    [0]lowpass=f=900,volume=0.10,afade=t=in:d=2.5,afade=t=out:st=55:d=5[pad];
    [1]volume=0.55,afade=t=in:st=$BEAT_FROM:d=1.5,afade=t=out:st=54:d=2[kick];
    [2]highpass=f=7000,volume=0.10[hat];
    [3]bandpass=f=1800:width_type=o:w=2.2,volume=0.45[whoosh];
    [4]lowpass=f=220,volume=0.85[boom];
    [pad][kick][hat][whoosh][boom]amix=inputs=5:normalize=0,
      aecho=0.8:0.5:60|120:0.25|0.15,
      loudnorm=I=-16:TP=-1.5:LRA=11,
      aformat=channel_layouts=stereo,aresample=$SR
  " -t $D "$OUT"

echo "soundtrack -> $OUT"
