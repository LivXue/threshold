# THRESHOLD

The bilingual promotional website for THRESHOLD, an FPS boss battle game.

- [Chinese website](https://livxue.github.io/threshold/)
- [English website](https://livxue.github.io/threshold/en/)

The site includes a draggable 360-degree Warden view, a scrolling battle
sequence, and videos showing the game's development.

## Local preview

Run this command from the repository root:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000/> for Chinese or
<http://127.0.0.1:8000/en/> for English.

## Deployment

GitHub Pages serves the root of the `main` branch. The `.nojekyll` file
keeps the site as plain static files. No build step or package installation
is required.

Keep `site-design/` and the bundled media directory at the same level.
Both languages share the same images, videos, fonts, styles, and scripts.
