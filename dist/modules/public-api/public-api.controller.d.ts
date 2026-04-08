import { ProcessesService } from '../processes/processes.service';
import { PublicCreateProcessDto } from './dto/public-create-process.dto';
import { UpdateProcessDto } from '../processes/dto/update-process.dto';
export declare class PublicApiController {
    private readonly processesService;
    constructor(processesService: ProcessesService);
    findAll(tenantId: string): Promise<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        category: import(".prisma/client").$Enums.ProcessCategory;
        version: number;
    }[]>;
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
    create(dto: PublicCreateProcessDto): Promise<{
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
    update(id: string, dto: UpdateProcessDto): Promise<{
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
    delete(id: string): Promise<{
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
