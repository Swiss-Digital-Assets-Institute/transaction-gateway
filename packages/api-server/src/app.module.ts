import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { HashgraphModule } from './hashgraph/hashgraph.module';
import { VaultManagerModule } from './vault-manager/vault-manager.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: resolve(__dirname, '../../../../.env.api-server') }),
    HashgraphModule,
    VaultManagerModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
