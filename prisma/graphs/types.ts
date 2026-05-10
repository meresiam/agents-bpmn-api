// Shim de tipo apenas para a build-time check do seed.
// O backend nao precisa do tipo rico — o JSON e armazenado como Prisma.InputJsonValue.
// Tipo rico vive no frontend (agents-bpmn/frontend/src/lib/types.ts).
export type ProcessGraphJson = unknown;
