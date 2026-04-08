import { PrismaService } from '../prisma/prisma.service';
export declare class CommentsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByProcessId(processId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    create(data: {
        content: string;
        processId: string;
        authorId: string;
    }): import(".prisma/client").Prisma.Prisma__CommentClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findById(id: string): import(".prisma/client").Prisma.Prisma__CommentClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        processId: string;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    delete(id: string): import(".prisma/client").Prisma.Prisma__CommentClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        processId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
