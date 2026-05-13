# Happy Birthdayflix

Static HTML/CSS/JavaScript birthday website with Netflix, anime cozy night, scrapbook gallery, video memories, love letter, particles, and finale effects.

## Add Media

- Put couple photos in `img/` as `.jpg`, `.jpeg`, `.png`, or `.webp`.
- Put memory videos in `video/` as `.mp4` or `.webm`. Existing `.mov` files are also included, but `.mp4` is best for browser compatibility.
- Run `npm run scan` after adding or deleting media locally.

The site does not hardcode file names. `scripts/generate-media-manifest.js` scans the folders and writes `media-manifest.json`, then `app.js` renders the gallery and video section from that manifest.

## Local Preview

```bash
npm run build
npm run dev
```

Open `http://127.0.0.1:4175`.

## Vercel

Deploy the folder as a static project. Vercel will run `npm run build`, which regenerates `media-manifest.json` from `img/` and `video/` during deployment.
