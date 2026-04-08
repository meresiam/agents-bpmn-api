import { ProcessesService } from './processes.service';
export declare class ShareController {
    private readonly processesService;
    constructor(processesService: ProcessesService);
    findOne(id: string): Promise<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        category: import(".prisma/client").$Enums.ProcessCategory;
        graph: import("@prisma/client/runtime/library").JsonValue;
        version: number;
    }>;
}
