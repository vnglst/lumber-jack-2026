'use strict';
// Sound effect definitions, written by the sound studio (sounds.html → Save). Hand edits are fine too.
//
// A sound is a stack of layers played together:
//   tone : { type:'tone',  wave, freq, to, dur, vol, at, attack, vibRate, vibDepth }
//   noise: { type:'noise', filter, freq, to, q, dur, vol, at, attack }
// freq/to are Hz (to = 0 means no slide); at/dur/attack are seconds; vibDepth is a fraction of the pitch.
// Sound-level: vol (master), jitter (random pitch per play), repeat/gap/step (echo the stack, shifting by `step` semitones).
LJ.SFX_DEFAULTS = {
  "chop": {
    "desc": "Axe bites into a tree", "vol": 1, "jitter": 0.12, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "noise", "filter": "bandpass", "freq": 1300, "to": 700, "q": 3, "dur": 0.08, "vol": 0.6, "at": 0, "attack": 0.002 },
      { "type": "tone", "wave": "sine", "freq": 360, "to": 140, "dur": 0.07, "vol": 0.35, "at": 0, "attack": 0.002, "vibRate": 0, "vibDepth": 0 }
    ]
  },
  "saw": {
    "desc": "Chainsaw or sawmill grinding", "vol": 1, "jitter": 0.08, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "tone", "wave": "sawtooth", "freq": 95, "to": 120, "dur": 0.15, "vol": 0.12, "at": 0, "attack": 0.01, "vibRate": 38, "vibDepth": 0.25 },
      { "type": "noise", "filter": "highpass", "freq": 2600, "to": 0, "q": 1, "dur": 0.12, "vol": 0.12, "at": 0, "attack": 0.01 }
    ]
  },
  "fall": {
    "desc": "Creak... TIMBER... whump", "vol": 1, "jitter": 0.06, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "tone", "wave": "sawtooth", "freq": 190, "to": 95, "dur": 0.42, "vol": 0.07, "at": 0, "attack": 0.05, "vibRate": 14, "vibDepth": 0.07 },
      { "type": "tone", "wave": "triangle", "freq": 110, "to": 38, "dur": 0.45, "vol": 0.45, "at": 0.34, "attack": 0.004, "vibRate": 0, "vibDepth": 0 },
      { "type": "noise", "filter": "lowpass", "freq": 700, "to": 120, "q": 1, "dur": 0.5, "vol": 0.55, "at": 0.34, "attack": 0.004 },
      { "type": "noise", "filter": "bandpass", "freq": 2400, "to": 1200, "q": 1.5, "dur": 0.3, "vol": 0.15, "at": 0.36, "attack": 0.03 }
    ]
  },
  "coin": {
    "desc": "Ka-ching! Wood sold", "vol": 1, "jitter": 0, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "tone", "wave": "square", "freq": 988, "to": 0, "dur": 0.07, "vol": 0.1, "at": 0, "attack": 0.002, "vibRate": 0, "vibDepth": 0 },
      { "type": "tone", "wave": "square", "freq": 1319, "to": 0, "dur": 0.24, "vol": 0.1, "at": 0.07, "attack": 0.002, "vibRate": 0, "vibDepth": 0 },
      { "type": "tone", "wave": "triangle", "freq": 2637, "to": 0, "dur": 0.2, "vol": 0.05, "at": 0.07, "attack": 0.002, "vibRate": 18, "vibDepth": 0.01 }
    ]
  },
  "click": {
    "desc": "Soft wooden tok for buttons and orders", "vol": 1, "jitter": 0.05, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "tone", "wave": "sine", "freq": 900, "to": 500, "dur": 0.045, "vol": 0.22, "at": 0, "attack": 0.002, "vibRate": 0, "vibDepth": 0 },
      { "type": "noise", "filter": "bandpass", "freq": 3000, "to": 0, "q": 2, "dur": 0.02, "vol": 0.12, "at": 0, "attack": 0.001 }
    ]
  },
  "no": {
    "desc": "Bonk-bonk: can't do that", "vol": 1, "jitter": 0, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "tone", "wave": "square", "freq": 220, "to": 200, "dur": 0.09, "vol": 0.09, "at": 0, "attack": 0.003, "vibRate": 0, "vibDepth": 0 },
      { "type": "tone", "wave": "square", "freq": 165, "to": 150, "dur": 0.16, "vol": 0.09, "at": 0.11, "attack": 0.003, "vibRate": 0, "vibDepth": 0 }
    ]
  },
  "build": {
    "desc": "Hammer taps: something got built", "vol": 1, "jitter": 0.04, "repeat": 3, "gap": 0.11, "step": 2,
    "layers": [
      { "type": "noise", "filter": "bandpass", "freq": 1400, "to": 0, "q": 2.5, "dur": 0.05, "vol": 0.45, "at": 0, "attack": 0.001 },
      { "type": "tone", "wave": "sine", "freq": 520, "to": 260, "dur": 0.06, "vol": 0.25, "at": 0, "attack": 0.001, "vibRate": 0, "vibDepth": 0 }
    ]
  },
  "rock": {
    "desc": "Stone crumbles, or a building gets wrecked", "vol": 1, "jitter": 0.1, "repeat": 3, "gap": 0.06, "step": -3,
    "layers": [
      { "type": "noise", "filter": "lowpass", "freq": 1000, "to": 200, "q": 1, "dur": 0.22, "vol": 0.45, "at": 0, "attack": 0.002 },
      { "type": "tone", "wave": "triangle", "freq": 140, "to": 60, "dur": 0.1, "vol": 0.2, "at": 0, "attack": 0.002, "vibRate": 0, "vibDepth": 0 }
    ]
  },
  "hurt": {
    "desc": "Oof! Someone took a hit", "vol": 1, "jitter": 0.12, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "tone", "wave": "triangle", "freq": 420, "to": 180, "dur": 0.17, "vol": 0.3, "at": 0, "attack": 0.004, "vibRate": 25, "vibDepth": 0.08 },
      { "type": "tone", "wave": "square", "freq": 200, "to": 120, "dur": 0.1, "vol": 0.05, "at": 0, "attack": 0.004, "vibRate": 0, "vibDepth": 0 }
    ]
  },
  "howl": {
    "desc": "Awooo: a wolf pack is coming", "vol": 1, "jitter": 0.05, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "tone", "wave": "sine", "freq": 330, "to": 560, "dur": 0.7, "vol": 0.15, "at": 0, "attack": 0.15, "vibRate": 5, "vibDepth": 0.03 },
      { "type": "tone", "wave": "sine", "freq": 560, "to": 300, "dur": 0.9, "vol": 0.13, "at": 0.65, "attack": 0.05, "vibRate": 5.5, "vibDepth": 0.04 },
      { "type": "tone", "wave": "triangle", "freq": 660, "to": 1120, "dur": 0.7, "vol": 0.03, "at": 0, "attack": 0.15, "vibRate": 5, "vibDepth": 0.03 }
    ]
  },
  "laser": {
    "desc": "Pew! Laser pistol", "vol": 1, "jitter": 0.1, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "tone", "wave": "square", "freq": 1800, "to": 220, "dur": 0.13, "vol": 0.07, "at": 0, "attack": 0.002, "vibRate": 0, "vibDepth": 0 },
      { "type": "tone", "wave": "sine", "freq": 3200, "to": 600, "dur": 0.08, "vol": 0.05, "at": 0, "attack": 0.002, "vibRate": 0, "vibDepth": 0 }
    ]
  },
  "arrow": {
    "desc": "Fwip: an arrow flies", "vol": 1, "jitter": 0.1, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "noise", "filter": "bandpass", "freq": 4500, "to": 1500, "q": 2, "dur": 0.09, "vol": 0.3, "at": 0, "attack": 0.01 },
      { "type": "tone", "wave": "sine", "freq": 1400, "to": 600, "dur": 0.06, "vol": 0.04, "at": 0, "attack": 0.005, "vibRate": 0, "vibDepth": 0 }
    ]
  },
  "thud": {
    "desc": "Bulldozer bumps a tree, or an arrow hits", "vol": 1, "jitter": 0.1, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "noise", "filter": "lowpass", "freq": 500, "to": 0, "q": 1, "dur": 0.09, "vol": 0.45, "at": 0, "attack": 0.002 },
      { "type": "tone", "wave": "sine", "freq": 110, "to": 55, "dur": 0.1, "vol": 0.35, "at": 0, "attack": 0.002, "vibRate": 0, "vibDepth": 0 }
    ]
  },
  "drum": {
    "desc": "War drums: the forest folk attack", "vol": 1, "jitter": 0, "repeat": 4, "gap": 0.24, "step": -2,
    "layers": [
      { "type": "tone", "wave": "sine", "freq": 96, "to": 50, "dur": 0.25, "vol": 0.45, "at": 0, "attack": 0.003, "vibRate": 0, "vibDepth": 0 },
      { "type": "noise", "filter": "lowpass", "freq": 320, "to": 0, "q": 1, "dur": 0.09, "vol": 0.3, "at": 0, "attack": 0.002 }
    ]
  },
  "level": {
    "desc": "Fanfare: level up or order delivered", "vol": 1, "jitter": 0, "repeat": 1, "gap": 0.1, "step": 0,
    "layers": [
      { "type": "tone", "wave": "square", "freq": 523, "to": 0, "dur": 0.13, "vol": 0.08, "at": 0, "attack": 0.004, "vibRate": 0, "vibDepth": 0 },
      { "type": "tone", "wave": "square", "freq": 659, "to": 0, "dur": 0.13, "vol": 0.08, "at": 0.11, "attack": 0.004, "vibRate": 0, "vibDepth": 0 },
      { "type": "tone", "wave": "square", "freq": 784, "to": 0, "dur": 0.13, "vol": 0.08, "at": 0.22, "attack": 0.004, "vibRate": 0, "vibDepth": 0 },
      { "type": "tone", "wave": "square", "freq": 1047, "to": 0, "dur": 0.45, "vol": 0.08, "at": 0.33, "attack": 0.004, "vibRate": 6, "vibDepth": 0.015 },
      { "type": "tone", "wave": "triangle", "freq": 523, "to": 0, "dur": 0.45, "vol": 0.1, "at": 0.33, "attack": 0.004, "vibRate": 0, "vibDepth": 0 }
    ]
  }
};
