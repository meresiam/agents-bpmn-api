import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class ProcessesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllByTenant(tenantId: string): Prisma.PrismaPromise<{
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
    findAll(): Prisma.PrismaPromise<{
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
    findTenantsSummary(): Promise<{
        tenantId: string;
        processCount: number;
    }[]>;
    findById(id: string): Prisma.Prisma__ProcessClient<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        category: import(".prisma/client").$Enums.ProcessCategory;
        graph: Prisma.JsonValue;
        version: number;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findByTenantAndSlug(tenantId: string, slug: string): Prisma.Prisma__ProcessClient<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        category: import(".prisma/client").$Enums.ProcessCategory;
        graph: Prisma.JsonValue;
        version: number;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    create(data: Prisma.ProcessCreateInput): Prisma.Prisma__ProcessClient<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        category: import(".prisma/client").$Enums.ProcessCategory;
        graph: Prisma.JsonValue;
        version: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    update(id: string, data: Prisma.ProcessUpdateInput): Prisma.Prisma__ProcessClient<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        category: import(".prisma/client").$Enums.ProcessCategory;
        graph: Prisma.JsonValue;
        version: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    delete(id: string): Prisma.Prisma__ProcessClient<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        category: import(".prisma/client").$Enums.ProcessCategory;
        graph: Prisma.JsonValue;
        version: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
}
