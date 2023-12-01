import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HashgraphModule } from './hashgraph/hashgraph.module';
import { VaultManagerModule } from './vault-manager/vault-manager.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../../.env.api-server' }),
    HashgraphModule,
    VaultManagerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
