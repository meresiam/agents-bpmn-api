export interface UserPayload {
    sub: string;
    tenantId: string;
    role: string;
    email: string;
}
export declare const CurrentUser: (...dataOrPipes: (keyof UserPayload | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
