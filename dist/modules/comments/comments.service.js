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
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const comments_repository_1 = require("./comments.repository");
const processes_service_1 = require("../processes/processes.service");
let CommentsService = class CommentsService {
    constructor(repository, processesService) {
        this.repository = repository;
        this.processesService = processesService;
    }
    async findByProcess(processId, user) {
        await this.processesService.findOneForUser(processId, user);
        return this.repository.findByProcessId(processId);
    }
    async create(processId, content, user) {
        await this.processesService.findOneForUser(processId, user);
        return this.repository.create({
            content,
            processId,
            authorId: user.sub,
        });
    }
    async delete(commentId, user) {
        const comment = await this.repository.findById(commentId);
        if (!comment)
            throw new common_1.NotFoundException('Comentario nao encontrado');
        if (comment.authorId !== user.sub &&
            user.role !== 'ADMIN' &&
            user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException();
        }
        return this.repository.delete(commentId);
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [comments_repository_1.CommentsRepository,
        processes_service_1.ProcessesService])
], CommentsService);
//# sourceMappingURL=comments.service.js.map