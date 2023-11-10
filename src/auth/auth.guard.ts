import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get the "code" from the request body
    const oneTimeCode = request.body.oneTimeCode;

    // Check the OneTimeCode against the DB if its valid
    const validOneTimeCode = await this.prisma.userCertification.findFirst({ where: { OneTimeCode: oneTimeCode } });

    return !!validOneTimeCode;
  }
}
