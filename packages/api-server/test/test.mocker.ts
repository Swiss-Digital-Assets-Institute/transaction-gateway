export type MockType<T> = {
  [P in keyof T]?: jest.Mock<object | null>;
};

export const hashgraphServiceMockFactory = () => ({
  executeTransaction: jest.fn(),
  getOperatorAccountId: jest.fn(),
});
