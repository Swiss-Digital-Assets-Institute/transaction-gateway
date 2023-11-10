import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  let apiKeyGuard: ApiKeyGuard;
  const configServiceMock = {
    get: jest.fn(),
  };

  const globalApiKeyMock = 'Hello';

  beforeEach(async () => {
    configServiceMock.get.mockImplementation(() => {
      return globalApiKeyMock;
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();
    apiKeyGuard = module.get<ApiKeyGuard>(ApiKeyGuard);
  });

  it('should be defined', () => {
    expect(apiKeyGuard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access with valid API key', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: globalApiKeyMock,
            },
          }),
        }),
      } as ExecutionContext;

      expect(apiKeyGuard.canActivate(context)).toBe(true);
    });

    it('should block access if API key is missing', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      configServiceMock.get.mockImplementation(() => {});
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;
      let error;
      try {
        apiKeyGuard.canActivate(context);
      } catch (err) {
        error = err;
      }

      expect(error).toStrictEqual(new HttpException('No authorization key found.', HttpStatus.INTERNAL_SERVER_ERROR)); //if functionality throws the specific error 500
    });

    it('should block access if API key is incorrect', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 12345,
            },
          }),
        }),
      } as ExecutionContext;

      expect(apiKeyGuard.canActivate(context)).toBe(false);
    });
  });
});
