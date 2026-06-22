# DATA-MODEL — POP do TO-BE (Wave 6, Epic 6.A)

> Gate Schema-First (Tier 1 JP, obrigatório). Fonte de verdade do schema: `prisma/schema.prisma`.
> Escopo: persistir o **POP (Procedimento Operacional Padrão)** gerado a partir de um processo TO-BE.

---

## 1. Conceito

O POP é o entregável final do ciclo de consultoria (AS-IS → TO-BE → GAP → **POP**). A IA transforma o
grafo do TO-BE num documento operacional estruturado (objetivo, escopo, papéis, materiais, passos numerados,
indicadores, riscos). Um processo pode ter **vários POPs versionados** (cada `generate-pop` cria uma versão nova).

A ilustração por passo (Epic 6.B) e a UI/export (Epic 6.C) reusam este mesmo registro — as imagens entram
dentro de `content`, não exigem nova tabela.

## 2. Novo model `Pop`

```prisma
model Pop {
  id        String    @id @default(uuid())
  tenantId  String
  processId String    // processo (TO_BE ou SINGLE) que originou o POP
  process   Process   @relation(fields: [processId], references: [id], onDelete: Cascade)
  version   Int       @default(1)
  content   Json
  status    PopStatus @default(DRAFT)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([tenantId], name: "idx_pops_tenant_id")
  @@index([processId], name: "idx_pops_process_id")
  @@map("pops")
}

enum PopStatus {
  DRAFT
  APPROVED
}
```

`Process` ganha a back-relation `pops Pop[]`.

### Shape de `content` (JSON validado no `PopService`)

```ts
{
  titulo: string
  objetivo: string
  escopo: string
  responsaveis: { papel: string; descricao: string }[]   // derivados das lanes
  materiais: string[]                                     // sistemas/documentos
  passos: {
    ordem: number
    acao: string
    responsavel: string      // a lane do node, ou "Sistema (automatizado)"
    entrada: string
    saida: string
    pontoControle: string    // "" quando não se aplica
  }[]
  indicadores: string[]
  riscos: string[]
}
```

## 3. Invariantes

1. O POP vive no **mesmo `tenantId`** do processo de origem (isolamento multi-tenant — herdado de `process.tenantId`).
2. Pra um par AS-IS/TO-BE, o POP documenta a face **TO_BE** (`processId = id do TO_BE`). Pra um `SINGLE`, documenta o próprio.
3. `version` é monotônica por `processId`: cada geração = `maxVersion(processId) + 1`. Histórico preservado, nada é sobrescrito.
4. `status` inicia `DRAFT`; vai a `APPROVED` na Epic 6.C (sign-off do consultor).
5. Apagar o processo de origem apaga seus POPs (`onDelete: Cascade`) — POP não faz sentido sem o fluxo.

## 4. Migration (aditiva, não-quebra)

`20260622140000_add_pop`:

1. `CREATE TYPE "PopStatus" AS ENUM ('DRAFT', 'APPROVED');`
2. `CREATE TABLE "pops" (...)` com `content JSONB`, `status` default `DRAFT`, `version` default 1.
3. `CREATE INDEX` em `tenantId` e `processId`.
4. FK `processId → processes(id)` com `ON DELETE CASCADE ON UPDATE CASCADE`.

**Zero breaking change** (tabela e enum novos). Guard-rail Wave 1 (S1.3): `pg_dump` antes do `migrate deploy` em prod.

## 5. Naming Lock

| Camada | Forma |
|---|---|
| DB (tabela) | `pops` (`@@map`) |
| DB (colunas) | `tenantId`, `processId`, `version`, `content`, `status` (camelCase) |
| Enum DB | `PopStatus` (`DRAFT` / `APPROVED`) |
| JSON API | `content` segue o shape camelCase acima (`pontoControle`, etc.) |
| TS type | `PopContent`, `PopPasso`, `PopResponsavel` em `chat/pop/pop.service.ts` |

## 6. Contrato de API (Epic 6.A.1) — tenant-scoped, JWT global guard

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/chat/generate-pop` | `{ processId }` → gera POP do TO-BE, persiste, retorna POP completo |
| `GET` | `/api/v1/chat/pop/process/:processId` | lista POPs (metadados) do processo |
| `GET` | `/api/v1/chat/pop/:popId` | retorna 1 POP com `content` |

Throttle de `/chat/*` (10/min por IP) já cobre o `POST` (chamada LLM cara). Isolamento via
`ProcessesService.findOneForUser` / `getPairForUser` (403/404 cross-tenant).

---

## 7. Epic 6.B — Ilustração por etapa (Gemini + volume)

As imagens vivem **dentro de `Pop.content.passos[].imagemUrl`** (sem nova tabela). Geração via Gemini
(Nano Banana) REST; armazenamento em **volume persistente** (lock Tier 1 — Supabase/R2 fora).

### Layout no disco e entrega

```
{POP_IMAGE_DIR}/{popId}/{ordem}.png
GET /api/v1/chat/pop/image/{popId}/{ordem}.png   (público, uuid não-enumerável, @SkipThrottle)
```

`imagemUrl` carrega cache-bust (`?v={timestamp}`) pra regeneração sobrescrever no browser. O serve usa
`@Res()` direto (modo library-specific do Nest → ignora o `ResponseInterceptor` que envolve em `{data}`).
Guarda anti-path-traversal: `popId` ~ uuid, `file` ~ `^\d+\.png$`.

### Envs novas (Coolify)

| Env | Default | Nota |
|---|---|---|
| `GEMINI_API_KEY` | — | obrigatória pra ilustrar; já existe em `$MERESCLAUDE/.env`. Fail-soft: 503 se ausente (igual `ANTHROPIC_API_KEY`). |
| `POP_IMAGE_DIR` | `./pop-images` (dev) | em prod = caminho do **volume persistente** montado no Coolify (ex `/data/pop-images`). |
| `GEMINI_IMAGE_MODEL` | `gemini-2.5-flash-image` | configurável (o nome do modelo muda com versão). |

> **Provisão de infra (Meres):** declarar 1 volume persistente no app backend do Coolify e setar
> `POP_IMAGE_DIR` pra dentro dele. Sem volume, as imagens somem a cada redeploy.

### Endpoints 6.B/6.C

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/chat/pop/:popId/illustrate` | `{ ordens?: number[] }` → gera/regenera ilustração (sem `ordens` = passos sem imagem; máx 12/req) |
| `PATCH` | `/chat/pop/:popId` | `{ content?, status? }` → edição inline + status `DRAFT`→`APPROVED` (6.C) |
| `GET` | `/chat/pop/image/:popId/:file` | serve a imagem (público) |

## 8. Epic 6.C — Staleness (POP desatualizado)

`content.processVersion` guarda a `version` do TO-BE no momento da geração. O frontend compara com a
`version` atual do processo; se divergir, mostra "POP desatualizado" e oferece regerar. Sem coluna extra
(vive no JSON).
