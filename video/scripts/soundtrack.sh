#!/usr/bin/env bash
# Synthesises the 60 s soundtrack with ffmpeg alone (no samples, no licensing).
# Hit times are in seconds and line up with the scene timeline in src/Root.tsx:
#   transitions  -> soft air swooshes, centred on each 27-frame dissolve
#   crack/glitch -> gentle sub-bass impacts
set -euo pipefail
OUT=${1:-out/soundtrack.wav}
D=60
SR=48000

SWOOSH_AT=(4.95 9.45 16.95 27.45 38.95 47.45 51.95)
IMPACT_AT=(0.07 3.2 5.1 25.23 51.97)
PULSE_FROM=9
PULSE_TO=56
PULSE=1.0714   # half-time at 112 BPM: one soft thump every two beats

# Wide, rounded swells: slow attack into the cut, slower release after it.
swoosh_env=""
for T in "${SWOOSH_AT[@]}"; do
  swoosh_env+="+if(lt(t,$T),exp(-pow((t-$T)/0.38,2)),exp(-pow((t-$T)/0.55,2)))"
done
swoosh_env=${swoosh_env#+}

# Pitch-dropping sine boom, one per impact.
impact=""
for T in "${IMPACT_AT[@]}"; do
  impact+="+if(gte(t,$T),sin(2*PI*(40+45*exp(-(t-$T)*8))*(t-$T))*exp(-(t-$T)*3.2),0)"
done
impact=${impact#+}

# Warm pad that drifts between A minor and F major every 16 s.
AM="sin(2*PI*55*t)+0.5*sin(2*PI*82.41*t)+0.4*sin(2*PI*110*t)+0.25*sin(2*PI*130.81*t)+0.18*sin(2*PI*164.81*t)"
FM="sin(2*PI*43.65*t)+0.5*sin(2*PI*65.41*t)+0.4*sin(2*PI*87.31*t)+0.25*sin(2*PI*110*t)+0.18*sin(2*PI*130.81*t)"
MIX="(0.5+0.5*cos(2*PI*t/32))"

ffmpeg -y -loglevel error \
  -f lavfi -i "aevalsrc='($MIX*($AM)+(1-$MIX)*($FM))*(0.8+0.2*sin(2*PI*0.07*t))':s=$SR:d=$D" \
  -f lavfi -i "aevalsrc='if(between(t,$PULSE_FROM,$PULSE_TO),sin(2*PI*(44+30*exp(-mod(t,$PULSE)*20))*mod(t,$PULSE))*exp(-mod(t,$PULSE)*5),0)':s=$SR:d=$D" \
  -f lavfi -i "aevalsrc='(random(1)*2-1)*($swoosh_env)':s=$SR:d=$D" \
  -f lavfi -i "aevalsrc='$impact':s=$SR:d=$D" \
  -filter_complex "
    [0]lowpass=f=700,volume=0.10,afade=t=in:d=3,afade=t=out:st=54:d=6[pad];
    [1]lowpass=f=110,volume=0.16,afade=t=in:st=$PULSE_FROM:d=3,afade=t=out:st=52:d=4[pulse];
    [2]highpass=f=300,lowpass=f=1400,volume=0.06[swoosh];
    [3]lowpass=f=160,volume=0.30[boom];
    [pad][pulse][swoosh][boom]amix=inputs=4:normalize=0,
      aecho=0.8:0.6:90|170:0.22|0.12,
      loudnorm=I=-20:TP=-2:LRA=11,
      aformat=channel_layouts=stereo,aresample=$SR
  " -t $D "$OUT"

echo "soundtrack -> $OUT"
