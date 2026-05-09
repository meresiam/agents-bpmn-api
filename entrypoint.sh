#!/bin/sh
set -e

echo "[entrypoint] Running prisma migrate deploy..."
npx prisma migrate deploy

echo "[entrypoint] Running prisma db seed (idempotent)..."
npx ts-node -P prisma/tsconfig.seed.json prisma/seed.ts || echo "[entrypoint] seed skipped or already applied"

echo "[entrypoint] Starting NestJS server..."
exec node dist/main.js
