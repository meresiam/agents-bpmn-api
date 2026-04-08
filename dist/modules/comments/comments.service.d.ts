import { CommentsRepository } from './comments.repository';
import { ProcessesService } from '../processes/processes.service';
import { UserPayload } from '../../common/decorators/current-user.decorator';
export declare class CommentsService {
    private readonly repository;
    private readonly processesService;
    constructor(repository: CommentsRepository, processesService: ProcessesService);
    findByProcess(processId: string, user: UserPayload): Promise<({
        author: {
            email: string;
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        processId: string;
    })[]>;
    create(processId: string, content: string, user: UserPayload): Promise<{
        author: {
            email: string;
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        processId: string;
    }>;
    delete(commentId: string, user: UserPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        processId: string;
    }>;
}
