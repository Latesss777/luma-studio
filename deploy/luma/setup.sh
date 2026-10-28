#!/usr/bin/env bash
# Установка и обновление сайта Luma Studio. Запуск: ./setup.sh
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo "Нет файла .env. Скопируйте из .env.example и заполните."; exit 1; }

if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
fi

git -C ../.. pull
(cd ../.. && npm ci && npm run build)

sudo docker compose up -d
sudo docker compose ps
echo "Готово: https://$(grep ^LUMA_DOMAIN .env | cut -d= -f2)"
