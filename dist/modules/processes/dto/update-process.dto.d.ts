import { ProcessCategory } from '@prisma/client';
export declare class UpdateProcessDto {
    title?: string;
    description?: string;
    category?: ProcessCategory;
    graph?: Record<string, unknown>;
}
