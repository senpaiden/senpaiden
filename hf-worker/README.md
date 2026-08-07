---
title: Senpai Den HF Worker
emoji: 🥷
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
short_description: Senpai Den manga image processing worker
---

# Senpai Den — Background Processing Engine (Gradio Worker)

This Hugging Face Space runs the high-throughput Node.js image processing worker for **Senpai Den** behind a Python Gradio monitoring interface.

## Features
- **Node.js Worker Engine:** Polling Supabase queue, downloading images, Sharp WebP slicing, Blurhash generation, Cloudflare R2 uploads.
- **Auto-Supervision:** Python supervisor automatically installs Node dependencies and monitors worker process lifecycle.
- **Live Telemetry & Logs:** Real-time log stream and CPU/Memory usage monitoring.
