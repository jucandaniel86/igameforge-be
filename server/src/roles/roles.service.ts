import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Permission, Role, Prisma } from '../generated/prisma/client.js';
import { CreateRoleDto } from './dto/CreateRoleDto.js';
import { AttachRolePermissionsDto } from './dto/AttachRolePermissionsDto.js';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}
  async getPermissions(
    search: string,
    start: number,
    length: number,
  ): Promise<{ total: number; items: Permission[] }> {
    const where: Prisma.PermissionWhereInput = {};

    if (search.length > 1) {
      where.OR = [
        { name: { contains: search } },
        { resource: { contains: search } },
        { action: { contains: search } },
        { guardName: { contains: search } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.permission.count({
        where,
      }),
      this.prisma.permission.findMany({
        where,
        orderBy: {
          id: 'desc',
        },
        skip: (start - 1) * length,
        take: length,
      }),
    ]);

    return {
      total,
      items,
    };
  }

  async getRolesList(
    search: string,
    start: number,
    length: number,
  ): Promise<{ total: number; items: Role[] }> {
    const where: Prisma.RoleWhereInput = {};

    if (search.length > 1) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { guardName: { contains: search } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.role.count({
        where,
      }),
      this.prisma.role.findMany({
        where,
        orderBy: {
          id: 'desc',
        },
        skip: (start - 1) * length,
        take: length,
      }),
    ]);

    return {
      total,
      items,
    };
  }

  async getRolePermissions(
    roleId: number,
  ): Promise<{ permission_ids: bigint[]; permissions: Permission[] }> {
    const results = await this.prisma.roleHasPermission.findMany({
      where: {
        roleId: BigInt(roleId),
      },
      include: {
        permission: true,
      },
      orderBy: {
        permission: {
          name: 'asc',
        },
      },
    });

    return {
      permission_ids: results.map((item) => item.permissionId),
      permissions: results.map((item) => item.permission),
    };
  }

  async saveRole(request: CreateRoleDto) {
    const guardName = request.guard_name ?? 'api';
    const existingRole = await this.prisma.role.findUnique({
      where: {
        name_guardName: {
          name: request.name,
          guardName,
        },
      },
    });

    if (existingRole) {
      throw new UnprocessableEntityException(
        'Role already exists for this guard',
      );
    }

    try {
      const Role = await this.prisma.role.create({
        data: {
          name: request.name,
          guardName,
          description: request.description ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return {
        role: Role,
        message: 'The role was created successfuly',
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UnprocessableEntityException(
          'Role already exists for this guard',
        );
      }

      throw error;
    }
  }

  async deleteRole(roleId: number) {
    try {
      await this.prisma.role.delete({
        where: {
          id: BigInt(roleId),
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new UnprocessableEntityException('Role cannot be delete');
        }
      }
      throw error;
    }
  }

  async syncPermissions(dto: AttachRolePermissionsDto): Promise<boolean> {
    const roleId = BigInt(dto.role_id);

    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
      select: {
        id: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Invalid Role');
    }

    const permissionIds = [
      ...new Set(dto.permission_ids.map((id) => BigInt(id))),
    ];

    await this.prisma.$transaction(async (tx) => {
      await tx.roleHasPermission.deleteMany({
        where: {
          roleId,
        },
      });

      if (permissionIds.length) {
        await tx.roleHasPermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),

          skipDuplicates: true,
        });
      }
    });

    return true;
  }

  async updateRole(request: CreateRoleDto) {
    const roleId = BigInt(request.id);

    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
    });

    if (!role) {
      throw new NotFoundException('Invalid Role');
    }

    const guardName = request.guard_name ?? role.guardName;

    const existingRole = await this.prisma.role.findUnique({
      where: {
        name_guardName: {
          name: request.name,
          guardName,
        },
      },
    });

    if (existingRole && existingRole.id !== roleId) {
      throw new UnprocessableEntityException(
        'Role already exists for this guard',
      );
    }

    try {
      return await this.prisma.role.update({
        where: {
          id: roleId,
        },
        data: {
          name: request.name,
          guardName,
          description: request.description ?? null,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new UnprocessableEntityException(
            'Role already exists for this guard',
          );
        }

        if (error.code === 'P2025') {
          throw new NotFoundException('Invalid Role');
        }
      }

      throw error;
    }
  }
}
