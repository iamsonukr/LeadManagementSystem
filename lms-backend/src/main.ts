import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: false,
      transform: true, // auto-cast query params to declared types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use((req: any, res: any, next: () => void) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });

  // Swagger / OpenAPI  It creates a Swagger document with a title, description, and version.
  const config = new DocumentBuilder()
    .setTitle('CRM API')
    .setDescription('REST API for the CRM Next.js application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 4000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`CRM API running on http://${host}:${port}`);
  console.log(`Swagger docs at http://${host}:${port}/api/docs`);
}

void bootstrap();
