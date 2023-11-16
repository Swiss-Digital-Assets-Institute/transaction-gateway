import { Test, TestingModule } from '@nestjs/testing';
import { MockType, hashgraphServiceMockFactory } from '../../test/test.mocker';
import { HashgraphController } from './hashgraph.controller';
import { HashgraphService } from './hashgraph.service';

describe('HashgraphController', () => {
  let controller: HashgraphController;
  let hashgraphService: MockType<HashgraphService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HashgraphController],
      providers: [{ provide: HashgraphService, useFactory: hashgraphServiceMockFactory }],
    }).compile();

    controller = module.get<HashgraphController>(HashgraphController);
    hashgraphService = module.get<MockType<HashgraphService>>(HashgraphService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('controller methods must call corresponding methods of hashgraph service', async () => {
    const bodyMock = { transaction: 'mock' };
    const resultMock = { mock: 'mock' };
    hashgraphService.executeTransaction.mockReturnValue(resultMock);
    const result1 = await controller.executeTransaction(bodyMock);
    expect(hashgraphService.executeTransaction).toHaveBeenCalledWith(bodyMock.transaction);
    expect(result1).toBe(resultMock);

    hashgraphService.getOperatorAccountId.mockReturnValue(resultMock);
    const result2 = await controller.getOperatorAccountId();
    expect(hashgraphService.getOperatorAccountId).toHaveBeenCalled();
    expect(result2).toBe(resultMock);
  });
});
