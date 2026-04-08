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
exports.ProcessesController = void 0;
const common_1 = require("@nestjs/common");
const processes_service_1 = require("./processes.service");
const create_process_dto_1 = require("./dto/create-process.dto");
const update_process_dto_1 = require("./dto/update-process.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let ProcessesController = class ProcessesController {
    constructor(processesService) {
        this.processesService = processesService;
    }
    async getTenants(user) {
        if (user.role !== 'SUPER_ADMIN')
            throw new common_1.ForbiddenException();
        return this.processesService.getTenants();
    }
    async findAll(user, tenantId) {
        if (user.role === 'SUPER_ADMIN' && tenantId) {
            return this.processesService.findAllByTenantId(tenantId);
        }
        return this.processesService.findAllForUser(user);
    }
    async findOne(id, user) {
        return this.processesService.findOneForUser(id, user);
    }
    async create(dto, user) {
        return this.processesService.create(user.tenantId, dto);
    }
    async update(id, dto, user) {
        return this.processesService.updateForUser(id, user, dto);
    }
    async delete(id, user) {
        return this.processesService.deleteForUser(id, user);
    }
};
exports.ProcessesController = ProcessesController;
__decorate([
    (0, common_1.Get)('tenants'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProcessesController.prototype, "getTenants", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProcessesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProcessesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_process_dto_1.CreateProcessDto, Object]),
    __metadata("design:returntype", Promise)
], ProcessesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_process_dto_1.UpdateProcessDto, Object]),
    __metadata("design:returntype", Promise)
], ProcessesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProcessesController.prototype, "delete", null);
exports.ProcessesController = ProcessesController = __decorate([
    (0, common_1.Controller)('processes'),
    __metadata("design:paramtypes", [processes_service_1.ProcessesService])
], ProcessesController);
//# sourceMappingURL=processes.controller.js.map