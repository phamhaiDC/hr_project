import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfficeDto } from './dto/create-office.dto';

@Injectable()
export class OfficeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOfficeDto) {
    return this.prisma.officeLocation.create({ data: dto });
  }

  async findAll() {
    return this.prisma.officeLocation.findMany({
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const office = await this.prisma.officeLocation.findUnique({
      where: { id },
      include: {
        employees: {
          select: { id: true, code: true, fullName: true, status: true },
          orderBy: { id: 'asc' },
        },
        _count: { select: { employees: true } },
      },
    });
    if (!office) throw new NotFoundException(`Office ${id} not found`);
    return office;
  }
}
