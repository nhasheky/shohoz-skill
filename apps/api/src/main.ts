import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { json, urlencoded } from 'express';
import type { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Large media uploads (demo/full PDFs, covers). Base64 inflates a file by
  // ~33%, so a 500MB upload arrives as ~670MB of JSON — leave headroom.
  app.use(json({ limit: '800mb' }));
  app.use(urlencoded({ extended: true, limit: '800mb' }));
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-LiteSpeed-Cache-Control', 'no-cache');
    next();
  });
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
