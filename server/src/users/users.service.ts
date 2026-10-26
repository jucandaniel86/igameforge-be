import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Environment,
  Prisma,
  User,
  UserType,
} from '../generated/prisma/client.js';
import { SaveUsersDto } from './dto/SaveUsersDto.js';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/ChangePasswordDto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsersList(
    search: string,
    start: number,
    length: number,
  ): Promise<{ total: number; items: User[] }> {
    const where: Prisma.UserWhereInput = {};

    if (search?.length > 2) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({
        where,
      }),
      this.prisma.user.findMany({
        where,
        include: {
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
        skip: (start - 1) * length,
        take: length,
      }),
    ]);

    const items = users.map((user) => {
      const role = user.roles[0]?.role;
      const { roles, ...userData } = user;

      return {
        ...userData,
        role_id: role?.id ?? null,
        role_name: role?.name ?? null,
      };
    });

    return {
      total,
      items,
    };
  }

  async saveUser(request: SaveUsersDto) {
    const envs = request.environments?.envs ?? [];
    const defaultEnv = request.environments?.defaultEnv ?? envs[0];
    const id = request.id ? BigInt(request.id) : null;

    return this.prisma.$transaction(async (tx) => {
      const data = {
        name: request.name,
        email: request.email,
        siteId: request.site_id ?? '',
        userType: UserType.admin,
        provider: request.provider_id ?? '',
        allowedEnvs: envs,
        env: defaultEnv,
      };

      const password = request.password?.length
        ? await bcrypt.hash(request.password, 12)
        : undefined;
      let user;

      if (!id) {
        if (!password) {
          throw new BadRequestException(
            'Password is required when creating a user',
          );
        }

        user = await tx.user.create({
          data: {
            ...data,
            password,
          },
        });
      } else {
        user = await tx.user.update({
          where: {
            id,
          },
          data: {
            ...data,
            ...(password ? { password } : {}),
          },
        });
      }

      // 4. Actualizăm rolul dacă a fost trimis

      if (
        request.roles !== undefined &&
        request.roles !== null &&
        request.roles !== ''
      ) {
        const roleValue = String(request.roles);

        const role = /^\d+$/.test(roleValue)
          ? await tx.role.findUnique({
              where: {
                id: BigInt(roleValue),
              },
            })
          : await tx.role.findFirst({
              where: {
                name: roleValue,
              },
            });

        if (role) {
          await tx.userRole.deleteMany({
            where: {
              userId: user.id,
            },
          });
          await tx.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id,
            },
          });
        }
      }
      // 5. Returnăm utilizatorul fără parolă
      const { password: _, ...safeUser } = user;
      return safeUser;
    });
  }

  async deleteUser(roleId: number) {
    try {
      await this.prisma.user.delete({
        where: {
          id: BigInt(roleId),
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new UnprocessableEntityException('User cannot be delete');
        }
      }
      throw error;
    }
  }

  async changePassword(dto: ChangePasswordDto) {
    if (dto.new_password !== dto.new_password_confirmation) {
      throw new BadRequestException('Passwords do not match');
    }

    const password = await bcrypt.hash(dto.new_password, 12);
    try {
      await this.prisma.user.update({
        where: {
          id: BigInt(dto.id),
        },
        data: {
          password,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }

    return true;
  }
}
