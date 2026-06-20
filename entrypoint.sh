#!/bin/sh
set -e

# W1 S1.3.b — seed NAO roda no boot (apagava/recriava dados). Para popular um
# ambiente novo, rodar manualmente: `npm run prisma:seed`.
# S1.3.c — migrate deploy fica no boot, mas a regra e: pg_dump manual ANTES de
# todo deploy que carregue migration (guard-rail pre-deploy-gate, backup <24h).
echo "[entrypoint] Running prisma migrate deploy..."
npx prisma migrate deploy

echo "[entrypoint] Starting NestJS server..."
exec node dist/main.js
