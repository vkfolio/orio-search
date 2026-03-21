#!/bin/sh
set -e

CONFIG="/data/config.yaml"

if [ ! -f "$CONFIG" ]; then
    echo "==> Generating default config.yaml in /data"
    cp /app/config.yaml "$CONFIG"
fi

export ORIO_SEARCH_CONFIG="$CONFIG"

exec gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 4 \
    --bind 0.0.0.0:8000 \
    --timeout 60 \
    --graceful-timeout 30 \
    --keep-alive 5 \
    --access-logfile -
