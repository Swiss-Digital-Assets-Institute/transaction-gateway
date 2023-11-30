import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './user/user.module';
import { HashgraphModule } from './hashgraph/hashgraph.module';
import { VaultManagerModule } from './vault-manager/vault-manager.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../../.env.api-server' }),
    UserModule,
    HashgraphModule,
    VaultManagerModule,
    MailerModule.forRoot({
      transport: `smtps://${process.env.SMTP_LOGIN}:${process.env.SMTP_PASSWORD}@${process.env.SMTP_SERVER}`,
      defaults: {
        from: process.env.SMTP_LOGIN,
      },
      template: {
        dir: __dirname + '/assets/email-templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
