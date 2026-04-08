import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { UserPayload } from '../../../common/decorators/current-user.decorator';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: UserPayload): UserPayload;
}
export {};
