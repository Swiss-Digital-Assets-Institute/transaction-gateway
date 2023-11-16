import { Prisma } from '@prisma/client';

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<object | null>;
};

export type MockPrismaType = {
  user?: MockType<Prisma.UserDelegate>;
};

const prismaEntityMockFactory = () => ({
  findFirst: jest.fn(),
  findMany: jest.fn(),
});

export const hashgraphServiceMockFactory = () => ({
  executeTransaction: jest.fn(),
  getOperatorAccountId: jest.fn(),
});

export const prismaMockFactory = () => {
  return {
    user: prismaEntityMockFactory(),
  };
};
