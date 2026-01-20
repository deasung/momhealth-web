#!/bin/bash

PROJECT_ROOT="/home/ec2-user/app"
# PM2 절대 경로 (보통 /usr/local/bin/pm2 또는 /usr/bin/pm2)
PM2_BIN=$(which pm2)

cd $PROJECT_ROOT

echo "Cleaning up existing PM2 process..."
$PM2_BIN delete nextjs || true

echo "Starting Next.js server with PM2..."
NODE_ENV=production $PM2_BIN start npm --name "nextjs" --update-env -- start -- -p 3300

$PM2_BIN save