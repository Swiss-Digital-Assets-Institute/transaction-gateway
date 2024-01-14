import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HashgraphModule } from './hashgraph/hashgraph.module';
import { VaultManagerModule } from './vault-manager/vault-manager.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: resolve(__dirname, '../../../../.env.api-server') }),
    HashgraphModule,
    VaultManagerModule,
    HealthModule,
  ],
  controllers: [],
})
export class AppModule {}
