import { ProcessesRepository } from './processes.repository';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { UserPayload } from '../../common/decorators/current-user.decorator';
export declare class ProcessesService {
    private readonly repository;
    constructor(repository: ProcessesRepository);
    private isSuperAdmin;
    getTenants(): Promise<{
        tenantId: string;
        processCount: number;
    }[]>;
    findAllForUser(user: UserPayload): Promise<{
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
    findOneForUser(id: string, user: UserPayload): Promise<{
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
    findOne(id: string, tenantId: string): Promise<{
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
    findOneAnyTenant(id: string): Promise<{
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
    create(tenantId: string, dto: CreateProcessDto): Promise<{
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
    update(id: string, tenantId: string, dto: UpdateProcessDto): Promise<{
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
    updateForUser(id: string, user: UserPayload, dto: UpdateProcessDto): Promise<{
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
    updateAnyTenant(id: string, dto: UpdateProcessDto): Promise<{
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
    deleteForUser(id: string, user: UserPayload): Promise<{
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
    delete(id: string, tenantId: string): Promise<{
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
    deleteAnyTenant(id: string): Promise<{
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
    findAllByTenantId(tenantId: string): Promise<{
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
}
