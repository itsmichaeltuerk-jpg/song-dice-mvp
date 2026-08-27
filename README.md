# Song Dice

A tabletop music sketchpad. Four dice — chords, bass, drums, melody — roll an 8-bar loop you can play, tweak, and bounce as WAV or MIDI.

## Play

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:8080`). Tap **Roll**, then **Play**.

| Key | Action |
| --- | --- |
| Space | Play / pause |
| R | Roll unlocked dice |

## What it does

- **Dice** pick a progression, bassline, kit, and hook. Lock a stem so the next roll keeps it.
- **Key, mode, BPM, swing** sit on the session bar. The arrangement grid lights the current step.
- **Mixer** levels, mute, and solo per stem.
- **Library** saves rolls in this browser.
- **Export** downloads stems or a mix as WAV, plus a Standard MIDI File for a DAW.

Audio is generated in the browser with the Web Audio API. Nothing is uploaded.

## Stack

React 19, TanStack Start, Vite, Tailwind, Zustand, Web Audio.

## Scripts

```bash
npm run dev        # local studio
npm run build      # production build
npm run typecheck
```
