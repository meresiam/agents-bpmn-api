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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApiController = void 0;
const common_1 = require("@nestjs/common");
const processes_service_1 = require("../processes/processes.service");
const api_key_guard_1 = require("./api-key.guard");
const public_create_process_dto_1 = require("./dto/public-create-process.dto");
const update_process_dto_1 = require("../processes/dto/update-process.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let PublicApiController = class PublicApiController {
    constructor(processesService) {
        this.processesService = processesService;
    }
    async findAll(tenantId) {
        return this.processesService.findAllByTenantId(tenantId);
    }
    async findOne(id) {
        return this.processesService.findOneAnyTenant(id);
    }
    async create(dto) {
        return this.processesService.create(dto.tenantId, {
            slug: dto.slug,
            title: dto.title,
            description: dto.description,
            category: dto.category,
            graph: dto.graph,
        });
    }
    async update(id, dto) {
        return this.processesService.updateAnyTenant(id, dto);
    }
    async delete(id) {
        return this.processesService.deleteAnyTenant(id);
    }
};
exports.PublicApiController = PublicApiController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [public_create_process_dto_1.PublicCreateProcessDto]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_process_dto_1.UpdateProcessDto]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "delete", null);
exports.PublicApiController = PublicApiController = __decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Controller)('public/processes'),
    __metadata("design:paramtypes", [processes_service_1.ProcessesService])
], PublicApiController);
//# sourceMappingURL=public-api.controller.js.map