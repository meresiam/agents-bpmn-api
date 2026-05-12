import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../common/decorators/current-user.decorator';

@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('role') role?: Role,
    @Query('q') q?: string,
  ) {
    return this.usersService.findAll({ tenantId, role, q });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() acting: UserPayload,
  ) {
    return this.usersService.update(id, dto, acting.sub);
  }

  @Patch(':id/password')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, dto.password);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() acting: UserPayload,
  ) {
    return this.usersService.delete(id, acting.sub);
  }
}
