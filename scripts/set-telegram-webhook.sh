#!/bin/zsh
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: TELEGRAM_BOT_TOKEN=... $0 <base-url>"
  echo "Example: TELEGRAM_BOT_TOKEN=... $0 https://net-m7uj.onrender.com"
  exit 1
fi

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "TELEGRAM_BOT_TOKEN is required."
  exit 1
fi

BASE_URL="${1%/}"
WEBHOOK_URL="${BASE_URL}/api/telegram/webhook"

echo "Setting Telegram webhook to: ${WEBHOOK_URL}"

curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WEBHOOK_URL}\",\"drop_pending_updates\":false}"

echo
echo "Fetching webhook info..."
curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
