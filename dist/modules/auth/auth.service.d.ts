import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<{
        tenantId: string;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        id: string;
        password: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            tenantId: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    getMe(userId: string): Promise<{
        tenantId: string;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        id: string;
        name: string;
    }>;
}
