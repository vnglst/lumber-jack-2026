# Animal sound credits

## Audio licensing

Audio is excluded from the repository's MIT license. The downloaded creature
recordings and their adaptations described below retain CC0 1.0. Personal
recordings are all rights reserved by their respective performers, including
the dialogue, forest-folk cues and the personal replacement of `wolf_snarl.wav`.
Permission to play these recordings as part of this game does not grant a
separate license to reuse or redistribute them in other projects.

The published game includes downloadable recordings and the public
Koen & Tibo credits. Before adding a new personal recording, obtain the
performer's permission to publish it with the game.

## Downloaded creature recordings

The eight original animal recordings preserved in `audio/voice-defaults/` are adapted from **80 CC0 creature SFX** by **rubberduck** (2018), published on OpenGameArt:

- Source page: https://opengameart.org/content/80-cc0-creature-sfx
- Original archive: https://opengameart.org/sites/default/files/80-CC0-creature-SFX_0.zip
- License for the source and adapted WAVs: **CC0 1.0 Universal**, https://creativecommons.org/publicdomain/zero/1.0/
- Retrieved 14 November 2026. The uploader explains in the page comments that most sounds, including the dog sounds, were performed with their mouth and filtered.

These are playful, performed creature voices assigned to the game's animals, not wildlife field recordings. No recordings from the earlier real-wildlife search are shipped.

| Original file in `audio/voice-defaults/` | Original archive file | Adaptation |
| --- | --- | --- |
| `wolf_howl.wav` | `howl.ogg` | 0.92× pitch/speed; little comic howl |
| `wolf_snarl.wav` | `barking_02.ogg` | 0.90× pitch/speed; short grumpy bark |
| `wolf_yelp.wav` | `hurt_04.ogg` | 1.25× pitch/speed; tiny surprised yip |
| `bear_roar.wav` | `grunt_01.ogg` | 0.70× pitch/speed; grumbly bear voice |
| `bear_groan.wav` | `hurt_02.ogg` | 0.70× pitch/speed; comic defeated grumble |
| `reindeer_call.wav` | `cute_03.ogg` | 0.85× pitch/speed; mellow chirrup |
| `squirrel_call.wav` | `cute_07.ogg` | 1.35× pitch/speed; three chitters with 70 ms gaps |
| `swan_call.wav` | `cute_09.ogg` | 1.05× pitch/speed; questioning honk |

These original clips were converted to mono 22,050 Hz PCM WAV, filtered at 100–8,000 Hz, normalized to a peak below −6 dBFS, and given short fades to avoid clicks. Each lasts 0.28–1.34 seconds. The game adds its existing slight pitch variation; peaceful wildlife plays more quietly than combat cues.

The recording booth can preview these originals alongside the current game sound in `audio/voice/`, replace a cue with a microphone take, or restore its original through the local save API. The source, CC0 license and processing above apply to the preserved originals and unchanged copies in `audio/voice/`, not personal replacements. `audio/voice/wolf_snarl.wav` is a personal replacement; its downloaded original remains in `audio/voice-defaults/`.

Koen & Tibo contributed play testing and voice recordings. The recording booth may replace any animal voice later; the table above describes the downloaded originals. Player-facing credits appear in the in-game popup reached from the welcome screen or settings menu.

## The Lumberjack Song excerpts

Two Monty Python song excerpts are carried over, byte-for-byte, from Koen van Gilst’s original Lumber Jack game:

- Solo: `audio/song/im-a-lumberjack.mp3`, from https://github.com/vnglst/lumber-jack/blob/master/public/audio/im-a-lumberjack.mp3
- Chorus: `audio/song/hes-a-lumberjack.mp3`, from https://github.com/vnglst/lumber-jack/blob/master/public/audio/hes-a-lumberjack.mp3

Source revision: `67b6e4c090e6b912f01978f831c4a6cd2b2b87b8`. No trimming, pitch changes or re-encoding; playback gain is 0.6 on the effects bus. These third-party recordings are excluded from the code/art MIT license and the creature recordings’ CC0 license. The original repository does not state a license for the song excerpts; no additional permission is asserted here. Player-facing attribution appears in Credits.
