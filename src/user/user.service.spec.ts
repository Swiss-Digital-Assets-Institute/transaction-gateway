import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  const createMock = jest.fn();
  const updateMock = jest.fn();
  const deleteMock = jest.fn();
  const findUniqueMock = jest.fn();
  const findManyMock = jest.fn();
  const createManyMock = jest.fn();
  const userMock = {
    create: createMock,
    update: updateMock,
    delete: deleteMock,
    findUnique: findUniqueMock,
    findMany: findManyMock,
    createMany: createManyMock,
  };
  const userCertificationMock = {
    findUnique: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: { user: userMock, userCertification: userCertificationMock } },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create method should call create on prisma and return user', async () => {
    const userFirstNameMock = 'John';
    const userLastNameMock = 'Dou';
    const userEmailMock = 'test@mail.com';
    const userRecordMock = { Email: userEmailMock, FirstName: userFirstNameMock, LastName: userLastNameMock };
    createMock.mockImplementation(async () => {
      return userRecordMock;
    });
    const result = await service.create(userRecordMock);
    expect(createMock).toHaveBeenCalledWith({ data: userRecordMock });
    expect(result).toBe(userRecordMock);
  });

  it('update method should call update on prisma and return user', async () => {
    const userFirstNameMock = 'John';
    const userLastNameMock = 'Dou';
    const userEmailMock = 'test@mail.com';
    const userRecordMock = { Email: userEmailMock, FirstName: userFirstNameMock, LastName: userLastNameMock };
    const userIdMock = 1;
    updateMock.mockImplementation(async () => {
      return userRecordMock;
    });
    const result = await service.update(userIdMock, userRecordMock);
    expect(updateMock).toHaveBeenCalledWith({
      data: userRecordMock,
      where: {
        UserId: userIdMock,
      },
    });
    expect(result).toBe(userRecordMock);
  });

  it('remove method should call delete on prisma and return userId', async () => {
    const userIdMock = 1;
    deleteMock.mockImplementation(async () => {
      return userIdMock;
    });
    const result = await service.remove(userIdMock);
    expect(deleteMock).toHaveBeenCalledWith({
      where: {
        UserId: userIdMock,
      },
    });
    expect(result).toBe(userIdMock);
  });

  it('findOne method should call findUnique on prisma and return user', async () => {
    const userNameMock = 'Company';
    const userIdMock = 1;
    const userRecordMock = { Name: userNameMock };
    findUniqueMock.mockImplementation(async () => {
      return userRecordMock;
    });
    const result = await service.findOne(userIdMock);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: {
        UserId: userIdMock,
      },
    });
    expect(result).toBe(userRecordMock);
  });

  it('findAll method should call findMany on prisma and return user', async () => {
    const userNameMock = 'Company';
    const usersRecordMock = [{ Name: userNameMock }];
    findManyMock.mockImplementation(async () => {
      return usersRecordMock;
    });
    const result = await service.findAll();
    expect(findManyMock).toHaveBeenCalledWith();
    expect(result).toBe(usersRecordMock);
  });

  it('findMany method should call corresponding method of prisma', async () => {
    const whereMock = { Email: 'email@mo.ck' };
    findManyMock.mockReset();
    await service.findMany(whereMock);
    expect(findManyMock).toHaveBeenCalledWith({ where: whereMock });
  });

  it('createMany method should call corresponding method of prisma', async () => {
    const inputMock = [{ Email: 'test@mail.com' }];
    createManyMock.mockReset();
    await service.createMany(inputMock);
    expect(createManyMock).toHaveBeenCalledWith({ data: inputMock });
  });
});
