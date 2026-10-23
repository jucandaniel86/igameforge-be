import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OperatorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(env: string) {
    return this.prisma.operator.findMany({
      where: {
        env,
      },
    });
  }

  async selector(env: string) {
    return this.prisma.operator
      .findMany({
        select: {
          name: true,
          siteId: true,
        },
        where: {
          env,
        },
      })
      .then((response) =>
        response.map((operator) => ({
          id: operator.siteId,
          label: operator.name,
        })),
      );
  }
}
