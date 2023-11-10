import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('v1');

  const config = new DocumentBuilder()
    .setTitle('The Hashgraph Association - Certification Service')
    .setDescription('A Certification backend service to issue and validate certificates')
    .setVersion('0.1')
    .addSecurity('apiKey', { type: 'apiKey', name: 'Authorization', in: 'header' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}
bootstrap();
