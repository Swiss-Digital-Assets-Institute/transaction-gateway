import { AccountId, Client, PrivateKey, PublicKey, TokenId } from '@hashgraph/sdk';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HashgraphService } from './hashgraph.service';

@Module({
  imports: [ConfigModule, Client], // Ensure ConfigModule is imported if not done already
  providers: [
    HashgraphService,
    {
      provide: Client, // This will make Client injectable
      useFactory: (configService: ConfigService) => {
        let client: Client;
        switch (configService.get<string>('HEDERA_NETWORK')) {
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
        client.setOperator(
          configService.get<string>('HEDERA_ACCOUNT_ID'),
          configService.get<string>('HEDERA_PRIVATE_KEY'),
        );
        return client;
      },
      inject: [ConfigService], // this ensures the ConfigService is injected into the factory
    },
    {
      provide: AccountId,
      useFactory: (configService: ConfigService) => {
        return AccountId.fromString(configService.get<string>('HEDERA_ACCOUNT_ID'));
      },
      inject: [ConfigService],
    },
    {
      provide: PublicKey,
      useFactory: (configService: ConfigService) => {
        return PublicKey.fromStringECDSA(configService.get<string>('HEDERA_PUBLIC_KEY'));
      },
      inject: [ConfigService],
    },
    {
      provide: PrivateKey,
      useFactory: (configService: ConfigService) => {
        return PrivateKey.fromString(configService.get<string>('HEDERA_PRIVATE_KEY'));
      },
      inject: [ConfigService],
    },
    {
      provide: TokenId,
      useFactory: (configService: ConfigService) => {
        return TokenId.fromString(configService.get<string>('TOKEN_ID'));
      },
      inject: [ConfigService],
    },
  ],
  exports: [HashgraphService, Client, PublicKey, PrivateKey, TokenId, AccountId], // Ensure Client is exported if it's needed elsewhere
})
export class HashgraphModule {}
