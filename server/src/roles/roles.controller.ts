import {
  Controller,
  Get,
  UseGuards,
  Query,
  Post,
  HttpCode,
  Body,
  Delete,
} from '@nestjs/common';
import { withMessage } from '../common/interceptors/response.interceptor.js';
import { RolesService } from './roles.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsListDto } from './dto/Permissions.dto.js';
import { RolesListDto } from './dto/Roles.dto.js';
import { RolePermissionDto } from './dto/RolePermission.dto.js';
import { CreateRoleDto } from './dto/CreateRoleDto.js';
import { DeleteRoleDto } from './dto/DeleteRoleDto.js';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('/permissions/list')
  @UseGuards(JwtAuthGuard)
  permissionsList(@Query() query: PermissionsListDto) {
    return this.rolesService.getPermissions(
      query.search ?? '',
      query.start,
      query.length,
    );
  }

  @Get('/list')
  @UseGuards(JwtAuthGuard)
  getRoleList(@Query() query: RolesListDto) {
    return this.rolesService.getRolesList(
      query.search ?? '',
      query.start,
      query.length,
    );
  }

  @Get('/permissions/by-role')
  @UseGuards(JwtAuthGuard)
  rolePermissions(@Query() query: RolePermissionDto) {
    return this.rolesService.getRolePermissions(query.role_id);
  }

  @Post('save')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async saveRole(@Body() dto: CreateRoleDto) {
    const result = await this.rolesService.saveRole(dto);
    return withMessage(result, 'The role was created successfully');
  }

  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  async deleteRole(@Query() query: DeleteRoleDto) {
    const result = await this.rolesService.deleteRole(query.role_id);

    return withMessage(result, 'The role was deleted successfully');
  }

  @Post('permissions/attach')
  @UseGuards(JwtAuthGuard)
  async attachPermissions(@Body() dto: any) {
    const result = await this.rolesService.syncPermissions(dto);

    return withMessage(result, 'Permissions were attached successfuly');
  }

  @Post('update')
  @UseGuards(JwtAuthGuard)
  async updateRole(@Body() dto: CreateRoleDto) {
    const result = await this.rolesService.updateRole(dto);
    return withMessage(result, 'The role was saved successfully');
  }
}
