#!/bin/bash
# Double-click to preview the eCon Growth site locally.
cd "$(dirname "$0")"
PORT=8123
echo "─────────────────────────────────────────────"
echo "  eCon Growth site preview"
echo "  Opening http://localhost:$PORT/ in your browser…"
echo "  (Leave this window open while you work. Close it to stop.)"
echo "─────────────────────────────────────────────"
( sleep 1.2 && open "http://localhost:$PORT/" ) &
python3 -m http.server "$PORT"
