import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Vault from 'hashi-vault-js';
import { VaultManagerService } from './vault-manager.service';

@Module({
  imports: [ConfigModule],
  providers: [
    VaultManagerService,
    {
      provide: Vault,
      useFactory: (configService: ConfigService) => {
        return new Vault({
          https: true,
          baseUrl: configService.get<string>('VAULT_API_URL'),
          timeout: 5000,
          proxy: false,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [VaultManagerService],
})
export class VaultManagerModule {}
