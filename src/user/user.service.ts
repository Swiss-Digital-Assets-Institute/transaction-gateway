import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  createMany(createUserDtos: Prisma.UserCreateManyInput[]) {
    return this.prisma.user.createMany({ data: createUserDtos });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number, include: Prisma.UserInclude = null) {
    return this.prisma.user.findUnique({ where: { UserId: id }, include });
  }

  async findMany(where: Prisma.UserWhereInput, include: Prisma.UserInclude = null) {
    return this.prisma.user.findMany({ where, include });
  }

  async findOneByOneTimeCode(oneTimeCode: string) {
    const userCertification = await this.prisma.userCertification.findUnique({
      where: { OneTimeCode: oneTimeCode },
      include: { User: true },
    });
    return userCertification?.User;
  }

  update(UserId: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { UserId },
      data: updateUserDto,
    });
  }

  remove(UserId: number) {
    return this.prisma.user.delete({ where: { UserId } });
  }
}
