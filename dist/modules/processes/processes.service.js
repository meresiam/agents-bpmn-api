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
exports.ProcessesService = void 0;
const common_1 = require("@nestjs/common");
const processes_repository_1 = require("./processes.repository");
let ProcessesService = class ProcessesService {
    constructor(repository) {
        this.repository = repository;
    }
    isSuperAdmin(user) {
        return user.role === 'SUPER_ADMIN';
    }
    async getTenants() {
        return this.repository.findTenantsSummary();
    }
    async findAllForUser(user) {
        if (this.isSuperAdmin(user)) {
            return this.repository.findAll();
        }
        return this.repository.findAllByTenant(user.tenantId);
    }
    async findOneForUser(id, user) {
        const process = await this.repository.findById(id);
        if (!process)
            throw new common_1.NotFoundException('Processo nao encontrado');
        if (!this.isSuperAdmin(user) && process.tenantId !== user.tenantId) {
            throw new common_1.ForbiddenException();
        }
        return process;
    }
    async findOne(id, tenantId) {
        const process = await this.repository.findById(id);
        if (!process)
            throw new common_1.NotFoundException('Processo nao encontrado');
        if (process.tenantId !== tenantId)
            throw new common_1.ForbiddenException();
        return process;
    }
    async findOneAnyTenant(id) {
        const process = await this.repository.findById(id);
        if (!process)
            throw new common_1.NotFoundException('Processo nao encontrado');
        return process;
    }
    async create(tenantId, dto) {
        const existing = await this.repository.findByTenantAndSlug(tenantId, dto.slug);
        if (existing)
            throw new common_1.ConflictException('Slug ja existe para este tenant');
        return this.repository.create({
            tenantId,
            slug: dto.slug,
            title: dto.title,
            description: dto.description,
            ...(dto.category && { category: dto.category }),
            graph: dto.graph,
        });
    }
    async update(id, tenantId, dto) {
        const process = await this.findOne(id, tenantId);
        return this.repository.update(process.id, {
            ...(dto.title && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.category && { category: dto.category }),
            ...(dto.graph && { graph: dto.graph, version: { increment: 1 } }),
        });
    }
    async updateForUser(id, user, dto) {
        const process = await this.findOneForUser(id, user);
        return this.repository.update(process.id, {
            ...(dto.title && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.category && { category: dto.category }),
            ...(dto.graph && { graph: dto.graph, version: { increment: 1 } }),
        });
    }
    async updateAnyTenant(id, dto) {
        await this.findOneAnyTenant(id);
        return this.repository.update(id, {
            ...(dto.title && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.category && { category: dto.category }),
            ...(dto.graph && { graph: dto.graph, version: { increment: 1 } }),
        });
    }
    async deleteForUser(id, user) {
        const process = await this.findOneForUser(id, user);
        return this.repository.delete(process.id);
    }
    async delete(id, tenantId) {
        const process = await this.findOne(id, tenantId);
        return this.repository.delete(process.id);
    }
    async deleteAnyTenant(id) {
        await this.findOneAnyTenant(id);
        return this.repository.delete(id);
    }
    async findAllByTenantId(tenantId) {
        return this.repository.findAllByTenant(tenantId);
    }
};
exports.ProcessesService = ProcessesService;
exports.ProcessesService = ProcessesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [processes_repository_1.ProcessesRepository])
], ProcessesService);
//# sourceMappingURL=processes.service.js.map