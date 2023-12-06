import { Client } from '@hashgraph/sdk';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VaultManagerModule } from '../vault-manager/vault-manager.module';
import { HashgraphService } from './hashgraph.service';
import { HashgraphController } from './hashgraph.controller';

@Module({
  imports: [ConfigModule, Client, VaultManagerModule], // Ensure ConfigModule is imported if not done already
  providers: [
    HashgraphService,
    {
      provide: Client, // This will make Client injectable
      useFactory: (configService: ConfigService) => {
        let client: Client;
        switch (configService.get<string>('HASHGRAPH_NETWORK')) {
          case 'mainnet':
            client = Client.forMainnet();
            break;
          case 'testnet':
            client = Client.forTestnet();
            break;
          case 'preview':
            client = Client.forPreviewnet();
            break;
          default:
            client = Client.forTestnet();
        }
        return client;
      },
      inject: [ConfigService], // this ensures the ConfigService is injected into the factory
    },
  ],
  controllers: [HashgraphController],
  exports: [HashgraphService, Client], // Ensure Client is exported if it's needed elsewhere
})
export class HashgraphModule {}
