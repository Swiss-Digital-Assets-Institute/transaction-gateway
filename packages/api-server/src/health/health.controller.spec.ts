import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import {
  MockType,
  configServiceMockFactory,
  healthCheckServiceMockFactory,
  httpHealthIndicatorMockFactory,
} from '../../test/test.mocker';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: MockType<HealthCheckService>;
  let httpIndicator: MockType<HttpHealthIndicator>;
  let configService: MockType<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useFactory: healthCheckServiceMockFactory },
        { provide: HttpHealthIndicator, useFactory: httpHealthIndicatorMockFactory },
        { provide: ConfigService, useFactory: configServiceMockFactory },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get(HealthCheckService);
    httpIndicator = module.get(HttpHealthIndicator);
    configService = module.get(ConfigService);

    healthService.check.mockImplementation((functions: (() => unknown)[]) => {
      functions.forEach((func) => func());
      return { healthy: true };
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health data', async () => {
    const mirrorNodeUrlMock = 'mirrorNodeUrlMock';
    const vaultApiUrl = 'vaultApiUrl';
    // @ts-expect-error ignoring types
    configService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'HASHGRAPH_MIRROR_NODE_URL') return mirrorNodeUrlMock;
      if (key === 'VAULT_API_URL') return vaultApiUrl;
    });
    await controller.check();

    expect(httpIndicator.pingCheck).toBeCalledWith('mirror-node', 'mirrorNodeUrlMock/api/v1/blocks');
    expect(httpIndicator.pingCheck).toBeCalledWith('vault', 'vaultApiUrl/sys/health');
  });
});
