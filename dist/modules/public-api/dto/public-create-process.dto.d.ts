import { ProcessCategory } from '@prisma/client';
export declare class PublicCreateProcessDto {
    tenantId: string;
    slug: string;
    title: string;
    description?: string;
    category?: ProcessCategory;
    graph: Record<string, unknown>;
}
