# Deployment

Lumberjack is deployed through Coolify as a static website. The published game
is HTML, CSS, JavaScript, images and audio. All game state and preferences stay
in the player's browser. Production has no game backend or recording API.

## Development and production

`make` serves the source tree on localhost with caching disabled. It includes
the recording booth, sprite viewer and scenario playground. The development
server binds to `127.0.0.1` and refuses hidden files such as `.git` and `.env`.
Keep it local; it is not a production server or a reverse-proxy backend.

`make dist` copies the production files into `dist/`. This is packaging, not
compilation: the game code is copied unchanged. The package includes resources
referenced by `index.html`, install icons, social artwork, the service worker,
search metadata, license notices and only the recordings listed in the voice
manifest. It excludes developer pages and scripts, original audio backups,
tests, internal docs, repository metadata and unlisted recording takes.
Repackaging replaces the previous `dist/`, removing stale files.

`make preview PORT=5174` serves only that package locally, without a write API.
Use a separate browser profile or port from development so its service worker
and saves do not interfere with the preview.

## Release flow

The hosting configuration selects an immutable source commit. Its source
updater follows this repository's `main` branch and updates that selection;
Coolify then deploys the selected static files. Packaging happens here before
the release commit. The hosting build only copies the prepared files.

1. Run `make release` (Python 3.9+ and Node are needed locally).
2. Preview the package, including a new game and an existing save. With the
   service worker enabled, reload offline and confirm that the save restores.
   Recorded voices need a connection; offline play falls back to text.
3. Review `dist/` and include it with the corresponding source in the release
   commit. Regenerate it after any shipped change, including new recordings.
4. When ready to publish, push the reviewed release to `main`. The source
   updater selects the commit and Coolify deploys it. Confirm the selected
   revision and successful deployment; a source push is not proof of release.
5. Check HTTPS, the opening screen, mobile controls, audio, installation,
   sharing, offline startup and saved-game restoration on the published site.

For HTML/CSS/game-script changes, bump `CACHE` in `sw.js` before packaging and
keep its `CORE` list complete. Keep the manifest and service worker available
with revalidation; avoid long-lived caching for files without versioned names.
Old game tabs must close before a waiting service-worker update activates.

### Hosting output

The hosting recipe requires `dist/index.html` and copies **only `dist/.`**
into its static output directory. This includes the PWA shell and icons and
excludes the development tools. This switch was deployed on 15 November 2026.
The source commit it selects must include the generated `dist/` artifact.
Production serves the prepared files directly over HTTPS.

After deployment, confirm that `/manifest.webmanifest`, `/sw.js`, the icon
paths and `/audio/voice/manifest.json` load, while `/voices.html`,
`/playground.html`, `/sprites.html`, `/.git/HEAD`, `/.env`, `/tools/serve.py`
and `/api/voice/test` return 404. Missing paths must not fall back to the game.

To roll back, pause automatic source updates, select the previous known-good
release commit and redeploy it. Keep that revision selected until the source
is fixed, then resume updates. Browser saves stay local; old cached game tabs
may need to close before the rollback is visible.

## Public data, attribution and analytics

The public game credits Koen van Gilst and Koen & Tibo and links to the source.
The Git history includes the author's email address. Published audio files are
downloadable. Confirm each performer's permission before publishing new takes;
the MIT license excludes audio, with the CC0 exceptions in `audio/CREDITS.md`.
Keep `.env` files and private keys outside Git and the production package.

The production URL, share metadata and self-hosted Plausible configuration use
`https://lumber-jack.koenvangilst.nl/`. Confirm this domain is registered in the
Plausible dashboard and that an ordinary visit produces the expected event.
There are no analytics credentials in this repository. Dashboard registration
cannot be verified by inspecting the source alone.
