#!/bin/bash
# Vercel CLI 一键部署（需先安装 Vercel CLI：npm i -g vercel）
echo "开始构建..."
npm run build
echo "构建完成，准备部署..."
vercel --prod
