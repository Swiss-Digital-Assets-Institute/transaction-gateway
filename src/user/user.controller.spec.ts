import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UserController', () => {
  let controller: UserController;
  const userServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findOne: jest.fn(),
    findOneByOneTimeCode: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userServiceMock }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('functions should call corresponding UserService functions', async () => {
    const createSpy = jest.spyOn(userServiceMock, 'create');
    const updateSpy = jest.spyOn(userServiceMock, 'update');
    const removeSpy = jest.spyOn(userServiceMock, 'remove');
    const findOneSpy = jest.spyOn(userServiceMock, 'findOne');
    const findAllSpy = jest.spyOn(userServiceMock, 'findAll');

    const createInput: CreateUserDto = {
      Email: 'test@mail.com',
      FirstName: 'John',
      LastName: 'Doe',
    };
    const idInput = 1;

    await controller.create(createInput);
    expect(createSpy).toHaveBeenCalledWith(createInput);
    await controller.update(idInput, createInput);
    expect(updateSpy).toHaveBeenCalledWith(idInput, createInput);
    await controller.remove(idInput);
    expect(removeSpy).toHaveBeenCalledWith(idInput);
    await controller.findOne(idInput);
    expect(findOneSpy).toHaveBeenCalledWith(idInput);
    findOneSpy.mockReset();
    await controller.findOneWithRelations(idInput);
    expect(findOneSpy).toHaveBeenCalledWith(idInput);
    await controller.findAll();
    expect(findAllSpy).toHaveBeenCalled();
  });
});
