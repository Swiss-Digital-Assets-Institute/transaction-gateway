import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOkResponse({
    description: '200 when healthy',
  })
  check() {
    return this.health.check([
      () =>
        this.http.pingCheck(
          'mirror-node',
          this.configService.getOrThrow('HASHGRAPH_MIRROR_NODE_URL') + '/api/v1/blocks',
        ),
      () => this.http.pingCheck('vault', this.configService.getOrThrow('VAULT_API_URL') + '/sys/health'),
    ]);
  }
}
