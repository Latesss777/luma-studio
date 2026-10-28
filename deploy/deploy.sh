#!/usr/bin/env bash
# Установка и обновление Luma Studio на сервере.
# Запуск: ./deploy/deploy.sh   (из папки проекта, на сервере)
set -euo pipefail
cd "$(dirname "$0")/.."

git pull
npm ci
npm run build

sudo mkdir -p /var/www/luma-studio
sudo rm -rf /var/www/luma-studio/*
sudo cp -r frontend/dist/* /var/www/luma-studio/

sudo cp deploy/nginx-luma-studio.conf /etc/nginx/sites-available/luma-studio
sudo ln -sf /etc/nginx/sites-available/luma-studio /etc/nginx/sites-enabled/luma-studio
sudo nginx -t
sudo systemctl reload nginx

echo "Готово. Откройте: http://168.113.173.108:8080"
