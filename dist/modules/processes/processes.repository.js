"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const PROCESS_LIST_SELECT = {
    id: true,
    tenantId: true,
    slug: true,
    title: true,
    description: true,
    category: true,
    version: true,
    createdAt: true,
    updatedAt: true,
};
let ProcessesRepository = class ProcessesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAllByTenant(tenantId) {
        return this.prisma.process.findMany({
            where: { tenantId },
            orderBy: { updatedAt: 'desc' },
            select: PROCESS_LIST_SELECT,
        });
    }
    findAll() {
        return this.prisma.process.findMany({
            orderBy: [{ tenantId: 'asc' }, { updatedAt: 'desc' }],
            select: PROCESS_LIST_SELECT,
        });
    }
    async findTenantsSummary() {
        const results = await this.prisma.process.groupBy({
            by: ['tenantId'],
            _count: { id: true },
            orderBy: { tenantId: 'asc' },
        });
        return results.map((r) => ({
            tenantId: r.tenantId,
            processCount: r._count.id,
        }));
    }
    findById(id) {
        return this.prisma.process.findUnique({ where: { id } });
    }
    findByTenantAndSlug(tenantId, slug) {
        return this.prisma.process.findUnique({
            where: { uq_process_tenant_slug: { tenantId, slug } },
        });
    }
    create(data) {
        return this.prisma.process.create({ data });
    }
    update(id, data) {
        return this.prisma.process.update({ where: { id }, data });
    }
    delete(id) {
        return this.prisma.process.delete({ where: { id } });
    }
};
exports.ProcessesRepository = ProcessesRepository;
exports.ProcessesRepository = ProcessesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProcessesRepository);
//# sourceMappingURL=processes.repository.js.map