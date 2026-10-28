#!/usr/bin/env bash
# Полная установка или обновление на сервере. Запуск: ./setup.sh
set -euo pipefail
cd "$(dirname "$0")"

for f in .env schoolbot.env; do
  [ -f "$f" ] || { echo "Нет файла $f. Скопируйте из $f.example и заполните."; exit 1; }
done

# Docker, если его ещё нет
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
fi

# Node 22 для сборки сайта Luma
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
fi

# Исходники бота
BOT_DIR="$HOME/school-info-bot"
if [ ! -d "$BOT_DIR" ]; then
  git clone https://github.com/Latesss777/school-info-bot "$BOT_DIR"
else
  git -C "$BOT_DIR" pull
fi
export BOT_DIR

# Сайт Luma Studio: сборка, которую отдаёт Caddy
git -C ../.. pull
(cd ../.. && npm ci && npm run build)

sudo docker compose up -d --build
sudo docker compose ps
echo "Готово: бот https://$(grep ^BOT_DOMAIN .env | cut -d= -f2), сайт https://$(grep ^LUMA_DOMAIN .env | cut -d= -f2)"
