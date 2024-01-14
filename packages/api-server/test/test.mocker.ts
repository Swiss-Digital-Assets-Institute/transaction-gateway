export type MockType<T> = {
  [P in keyof T]?: jest.Mock<object | null>;
};

export const hashgraphServiceMockFactory = () => ({
  executeTransaction: jest.fn(),
  getOperatorAccountId: jest.fn(),
});

export const vaultManagerMockFactory = () => ({
  getAccountInfoSecret: jest.fn(),
});

export const healthCheckServiceMockFactory = () => ({
  check: jest.fn(),
});

export const httpHealthIndicatorMockFactory = () => ({
  pingCheck: jest.fn(),
});
export const configServiceMockFactory = () => ({
  get: jest.fn(),
  getOrThrow: jest.fn(),
});
