#!/usr/bin/env bash
# Всё сразу: создаёт .env с паролем базы, открывает файл для токенов бота и запускает установку.
# Запуск: ./bootstrap.sh
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cat > .env <<ENV
BOT_DOMAIN=school24bot.duckdns.org
LUMA_DOMAIN=lumastudio.duckdns.org
DB_PASSWORD=$(openssl rand -hex 16)
ENV
  echo "Создан .env. Пароль базы придуман автоматически."
fi

if [ ! -f schoolbot.env ]; then
  cp schoolbot.env.example schoolbot.env
  echo "Сейчас откроется файл. Вставьте значения из Railway → Variables, затем сохраните: Ctrl+O, Enter, Ctrl+X."
  read -rp "Нажмите Enter, чтобы открыть файл..." _
  nano schoolbot.env
fi

sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true

./setup.sh
