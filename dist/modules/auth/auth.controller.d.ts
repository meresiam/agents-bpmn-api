import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UserPayload } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            tenantId: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    me(user: UserPayload): Promise<{
        tenantId: string;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        id: string;
        name: string;
    }>;
}
