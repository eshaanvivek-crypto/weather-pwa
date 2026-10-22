# Simple Weather PWA

A small installable Progressive Web App that displays current weather using the Open-Meteo APIs.

## Run locally

Serve the files over HTTP (service workers require HTTPS or localhost):

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser.

## Install on iPhone

1. Open the deployed site in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.

The app supports city search and browser location. It uses Open-Meteo and does not require an API key.
