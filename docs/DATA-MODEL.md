# DATA-MODEL — Pareamento AS-IS / TO-BE (Wave 4, Epic 4.A)

> Gate Schema-First (Tier 1 JP, obrigatório). Fonte de verdade do schema: `prisma/schema.prisma`.
> Escopo: introduzir o conceito de **par de processos** (como É → como DEVERIA ser) sem quebrar os processos existentes.

---

## 1. Conceito

Um `Process` passa a ter uma **face** (`processKind`):

- `SINGLE` — processo avulso (todo processo que já existe hoje; default, não quebra nada).
- `AS_IS` — retrato do processo como ele é hoje (o lado mapeado no briefing).
- `TO_BE` — desenho do processo como deveria ser (o lado otimizado entregue na consultoria).

Um par é **AS_IS ⇄ TO_BE**. A análise de GAP (Epic 4.B) e o POP (Wave 6) atrelam ao `TO_BE`.

## 2. Mudança no model `Process`

```prisma
enum ProcessKind {
  SINGLE
  AS_IS
  TO_BE
}

model Process {
  // ...campos existentes...
  processKind     ProcessKind @default(SINGLE)
  pairedProcessId String?     @unique
  pairedProcess   Process?    @relation("ProcessPair", fields: [pairedProcessId], references: [id], onDelete: SetNull)
  pairedFrom      Process?    @relation("ProcessPair")
}
```

### Modelo da relação (self-relation 1:1)

- O lado **AS_IS é o dono do FK** (`pairedProcessId = id do TO_BE`).
- O lado **TO_BE não armazena FK** (`pairedProcessId = null`); chega no AS_IS pela back-relation `pairedFrom`.
- Resolver a contraparte a partir de **qualquer** face:
  `counterpart = process.pairedProcess ?? process.pairedFrom`.
- `@unique` no FK garante 1:1 (um AS_IS aponta pra no máximo um TO_BE).
- `onDelete: SetNull` — apagar uma face não derruba a outra; só desfaz o vínculo (sem cascade destrutivo, alinhado ao guard-rail da Wave 1).

> Decisão (Ultra Pareto): FK só de um lado evita FK mútuo redundante e o risco de inconsistência (A→B mas B→C). Lookup bidirecional resolvido por `pairedProcess ?? pairedFrom`.

## 3. Invariantes

1. Ambas as faces de um par vivem **no mesmo `tenantId`** (isolamento multi-tenant preservado — o TO_BE herda o tenant do AS_IS na criação).
2. Um `TO_BE` sempre tem um `AS_IS` de origem (existe via `pairedFrom`). Não se cria `TO_BE` órfão pela API de pareamento.
3. `processKind` só transiciona: `SINGLE → AS_IS` (no ato de parear). `AS_IS`/`TO_BE` não voltam pra `SINGLE` pela API (desfazer par = fora de escopo da 4.A).
4. Parear um processo que já é `AS_IS`/`TO_BE` (já tem par) → **409 Conflict**.
5. `pairedProcessId` referencia processo do mesmo tenant (validado no service, não só no banco).

## 4. Migration (expand-contract, não-quebra)

`20260620_add_process_pairing`:

1. `CREATE TYPE "ProcessKind" AS ENUM ('SINGLE', 'AS_IS', 'TO_BE');`
2. `ALTER TABLE "processes" ADD COLUMN "processKind" "ProcessKind" NOT NULL DEFAULT 'SINGLE';`
3. `ALTER TABLE "processes" ADD COLUMN "pairedProcessId" TEXT;`
4. `CREATE UNIQUE INDEX "processes_pairedProcessId_key" ON "processes"("pairedProcessId");`
5. FK self-ref `pairedProcessId → processes(id)` com `ON DELETE SET NULL ON UPDATE CASCADE`.

Linhas existentes assumem `processKind = SINGLE`, `pairedProcessId = NULL`. **Zero breaking change.** Sem backfill destrutivo.

> Guard-rail Wave 1 (S1.3): rodar `pg_dump` manual antes do `migrate deploy` em prod (esta migration adiciona coluna NOT NULL com default → segura, mas a regra vale).

## 5. Naming Lock

| Camada | Forma |
|---|---|
| DB (coluna) | `processKind`, `pairedProcessId` (camelCase — padrão do schema atual, sem `@@map` de coluna) |
| Enum DB | `ProcessKind` (`SINGLE` / `AS_IS` / `TO_BE`) |
| JSON API | `processKind`, `pairedProcessId` (camelCase) |
| TS type | `ProcessKind = 'SINGLE' \| 'AS_IS' \| 'TO_BE'` |

## 6. Contrato de API (Epic 4.A.2) — tenant-scoped

Todas sob `ProcessesController` (JWT global guard já ativo). Isolamento via `findOneForUser`.

### `POST /api/v1/processes/:id/pair`
Cria o `TO_BE` vinculado a partir do processo `:id` (que vira `AS_IS`).
- O `TO_BE` é um **clone do graph** do AS_IS (ponto de partida pro consultor refinar; a geração assistida por IA é a Epic 4.C).
- Body (opcional): `{ "title"?: string, "slug"?: string }`. Defaults: `title = "<asIs.title> (TO-BE)"`, `slug = "<asIs.slug>-to-be"` (desambiguado se colidir).
- Regras: 404 se `:id` não existe / outro tenant; 409 se `:id` já faz parte de um par.
- Resposta `201`: `{ asIs: ProcessDetail, toBe: ProcessDetail }`.

### `GET /api/v1/processes/:id/pair`
Retorna o par completo a partir de qualquer face.
- Resposta `200`: `{ asIs: ProcessDetail, toBe: ProcessDetail }`.
- 404 se `:id` é `SINGLE` (sem par) ou não pertence ao tenant.

## 7. Impacto no `PROCESS_LIST_SELECT`

Adicionar `processKind` e `pairedProcessId` ao select de listagem/detalhe pra UI mostrar a face e habilitar o botão "Comparar / Gerar TO-BE".

## 8. UI (Epic 4.A.3) — resumo

- Rota nova `/pair/[id]` → `PairView` read-only lado a lado (desktop) / abas empilhadas (mobile, Nielsen + mobile-first), com link "Abrir no editor" por face.
- `ProcessView` (`/bpmn/[id]`): header ganha botão contextual —
  - `SINGLE` → **"Gerar TO-BE"** (chama `POST .../pair`, navega pra `/pair/{asIsId}`).
  - `AS_IS`/`TO_BE` → **"Comparar AS-IS | TO-BE"** (navega pra `/pair/{id}`).
- Badge de face nos cards de fluxo (recognition, Nielsen H6).

## 9. Fora de escopo (4.A)

Desfazer par · análise de GAP (4.B) · geração IA do TO-BE (4.C) · versionamento/snapshot do par (S3.1). O clone inicial do TO-BE é placeholder editável até a 4.C entrar.
