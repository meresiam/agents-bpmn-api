import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserPayload } from '../../common/decorators/current-user.decorator';
export declare class CommentsController {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
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
    create(processId: string, dto: CreateCommentDto, user: UserPayload): Promise<{
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
    delete(id: string, user: UserPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        processId: string;
    }>;
}
