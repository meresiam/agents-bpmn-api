import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Dynamically require a TS graph file via ts-node.
 * Each file exports a named constant (the graph object).
 */
function loadGraph(filePath: string): Prisma.InputJsonValue {
  // Use require to load the TS file (ts-node handles compilation)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(filePath);
  // Get the first exported value
  const key = Object.keys(mod)[0];
  return mod[key] as Prisma.InputJsonValue;
}

async function main() {
  const BCRYPT_ROUNDS = 10;

  // Create SUPER_ADMIN (Bravy - ve todos os clientes/fluxos)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'jp@bravy.com.br' },
    update: {},
    create: {
      email: 'jp@bravy.com.br',
      password: await bcrypt.hash('bravy123456', BCRYPT_ROUNDS),
      name: 'JP — Bravy',
      tenantId: 'bravy',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Super Admin created:', superAdmin.email);

  // Create SUPER_ADMIN Meres (AILA founder — ve todos os clientes/fluxos)
  const meresAdmin = await prisma.user.upsert({
    where: { email: 'meres@ailalabs.com' },
    update: {
      password: await bcrypt.hash('aila123456', BCRYPT_ROUNDS),
      role: 'SUPER_ADMIN',
    },
    create: {
      email: 'meres@ailalabs.com',
      password: await bcrypt.hash('aila123456', BCRYPT_ROUNDS),
      name: 'Meres — AILA',
      tenantId: 'aila',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Super Admin Meres created:', meresAdmin.email);

  // Create tenant users
  const arwUser = await prisma.user.upsert({
    where: { email: 'admin@arw.com.br' },
    update: {},
    create: {
      email: 'admin@arw.com.br',
      password: await bcrypt.hash('arw123456', BCRYPT_ROUNDS),
      name: 'Admin ARW',
      tenantId: 'arw',
      role: 'ADMIN',
    },
  });

  const maturiUser = await prisma.user.upsert({
    where: { email: 'admin@maturi.com.br' },
    update: {},
    create: {
      email: 'admin@maturi.com.br',
      password: await bcrypt.hash('maturi123456', BCRYPT_ROUNDS),
      name: 'Admin Maturi',
      tenantId: 'maturi',
      role: 'ADMIN',
    },
  });

  // Cliente Marcelo Lexcont (visualizador read-only do tenant marcelo-lexcont).
  // Remove email antigo com typo (marcelolexon — sem o "c" e "t" da empresa Lexcont)
  // e cria/atualiza com o email correto.
  await prisma.user.deleteMany({ where: { email: 'marcelolexon@teste.com' } });
  const marceloUser = await prisma.user.upsert({
    where: { email: 'marcelolexcont@teste.com' },
    update: {
      password: await bcrypt.hash('12345678', BCRYPT_ROUNDS),
      tenantId: 'marcelo-lexcont',
      role: 'CLIENT',
    },
    create: {
      email: 'marcelolexcont@teste.com',
      password: await bcrypt.hash('12345678', BCRYPT_ROUNDS),
      name: 'Marcelo Lexcont',
      tenantId: 'marcelo-lexcont',
      role: 'CLIENT',
    },
  });

  console.log('Users created:', arwUser.email, maturiUser.email, marceloUser.email);

  // Load graphs inlined no proprio repo da API (prisma/graphs/) para nao depender do filesystem do frontend.
  const graphsDir = path.resolve(__dirname, 'graphs');

  const arwGraph = loadGraph(path.join(graphsDir, 'arw-comercial.ts'));
  const maturiComercialGraph = loadGraph(path.join(graphsDir, 'maturi-comercial.ts'));
  const maturiMarketingGraph = loadGraph(path.join(graphsDir, 'maturi-marketing.ts'));

  // Create processes
  await prisma.process.upsert({
    where: { uq_process_tenant_slug: { tenantId: 'arw', slug: 'comercial' } },
    update: { graph: arwGraph, category: 'COMERCIAL' },
    create: {
      tenantId: 'arw',
      slug: 'comercial',
      title: 'Processo Comercial',
      description: 'Fluxo completo de vendas: captacao → qualificacao → negociacao → fechamento → onboarding (BPMN 2.0)',
      category: 'COMERCIAL',
      graph: arwGraph,
    },
  });

  await prisma.process.upsert({
    where: { uq_process_tenant_slug: { tenantId: 'maturi', slug: 'comercial' } },
    update: { graph: maturiComercialGraph, category: 'COMERCIAL' },
    create: {
      tenantId: 'maturi',
      slug: 'comercial',
      title: 'Maturi — Comercial + Onboarding',
      description: 'Dois pools no mesmo diagrama: comercial (captacao → SDR → Closer → proposta → C4) conectado ao onboarding (form → contrato → Autentique → ativacao).',
      category: 'COMERCIAL',
      graph: maturiComercialGraph,
    },
  });

  await prisma.process.upsert({
    where: { uq_process_tenant_slug: { tenantId: 'maturi', slug: 'marketing' } },
    update: { graph: maturiMarketingGraph, category: 'MARKETING' },
    create: {
      tenantId: 'maturi',
      slug: 'marketing',
      title: 'Maturi — Marketing',
      description: 'Tres pools: Producao de Conteudo (Copywriting → Design) · Performance & Growth (Campanhas → Otimizacao → Publicos) · Publicacao (Posts + Disparos).',
      category: 'MARKETING',
      graph: maturiMarketingGraph,
    },
  });

  console.log('Processes seeded: arw/comercial, maturi/comercial, maturi/marketing');

  // Create API Key for Claude Code (idempotente: bcrypt salt randomico
  // impede upsert por hash, entao verificamos existencia via bcrypt.compare).
  const rawApiKey = 'bravy-bpmn-api-key-2026';
  const existingKeys = await prisma.apiKey.findMany({ where: { isActive: true } });
  let alreadyExists = false;
  for (const k of existingKeys) {
    if (await bcrypt.compare(rawApiKey, k.key)) {
      alreadyExists = true;
      break;
    }
  }

  if (!alreadyExists) {
    const hashedKey = await bcrypt.hash(rawApiKey, BCRYPT_ROUNDS);
    await prisma.apiKey.create({
      data: {
        key: hashedKey,
        name: 'Claude Code - Dev',
        isActive: true,
      },
    });
    console.log('API Key created. Raw key:', rawApiKey);
  } else {
    console.log('API Key already exists, skipping.');
  }
  console.log('Use header: X-API-Key:', rawApiKey);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
