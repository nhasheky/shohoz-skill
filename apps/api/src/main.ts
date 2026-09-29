import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(',') ?? [
      'http://localhost:3000',
      'https://shohozskill.com.bd',
      'https://www.shohozskill.com.bd',
      'https://shohoz-skill-web.vercel.app',
    ],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  new Logger('Bootstrap').log(`Shohoz Skill API running on http://localhost:${port}/api`);
}
await bootstrap();
