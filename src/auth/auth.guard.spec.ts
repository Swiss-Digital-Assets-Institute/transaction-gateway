import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from './auth.guard';

const mockExecutionContext = (oneTimeCode: string) => ({
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue({ body: { oneTimeCode: oneTimeCode } }),
  }),
});
describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let prisma: Partial<PrismaService>;
  type UserCertification = Prisma.PromiseReturnType<typeof prisma.userCertification.findFirst>;
  const userCertification: Partial<UserCertification> = { OneTimeCode: '123' };
  const mockPrisma = {
    userCertification: {
      findFirst: jest.fn(
        async <T extends Prisma.UserCertificationFindFirstArgs>(
          args: Prisma.SelectSubset<T, Prisma.UserCertificationFindFirstArgs<DefaultArgs>>,
        ): Promise<Partial<UserCertification>> => {
          if (args.where.OneTimeCode === userCertification.OneTimeCode) return userCertification;
        },
      ),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    authGuard = new AuthGuard(module.get<PrismaService>(PrismaService));
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  it('should fail because of mismatching one time code', async () => {
    const executionContextMock = mockExecutionContext('234');
    const isAllowed = await authGuard.canActivate(executionContextMock as unknown as ExecutionContext);
    expect(isAllowed).toBe(false);
  });

  it('should succeed because of correct one time code', async () => {
    const executionContextMock = mockExecutionContext('123');
    const isAllowed = await authGuard.canActivate(executionContextMock as unknown as ExecutionContext);
    expect(isAllowed).toBe(true);
  });
});
