import { ProcessesService } from './processes.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { UserPayload } from '../../common/decorators/current-user.decorator';
export declare class ProcessesController {
    private readonly processesService;
    constructor(processesService: ProcessesService);
    getTenants(user: UserPayload): Promise<{
        tenantId: string;
        processCount: number;
    }[]>;
    findAll(user: UserPayload, tenantId?: string): Promise<{
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
    findOne(id: string, user: UserPayload): Promise<{
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
    create(dto: CreateProcessDto, user: UserPayload): Promise<{
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
    update(id: string, dto: UpdateProcessDto, user: UserPayload): Promise<{
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
    delete(id: string, user: UserPayload): Promise<{
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
