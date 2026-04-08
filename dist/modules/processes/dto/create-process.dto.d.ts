import { ProcessCategory } from '@prisma/client';
export declare class CreateProcessDto {
    slug: string;
    title: string;
    description?: string;
    category?: ProcessCategory;
    graph: Record<string, unknown>;
}
