#!/bin/zsh
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: TELEGRAM_BOT_TOKEN=... $0 <ngrok-url>"
  echo "Example: TELEGRAM_BOT_TOKEN=... $0 https://swab-basil-comment.ngrok-free.dev"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"${SCRIPT_DIR}/set-telegram-webhook.sh" "$1"
