import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import packageJson from '../package.json' with { type: 'json' };
import { AppModule } from './app.module.js';
import { SWAGGER_PATH } from './common/constants/app.constants.js';
import { RoleSerializerInterceptor } from './common/interceptors/role-serializer.interceptor.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const ALLOWED_ORIGINS = configService.getOrThrow<string>('ALLOWED_ORIGINS');
  const PORT = configService.getOrThrow<number>('PORT');
  const ENV = configService.getOrThrow<string>('NODE_ENV');
  const HOST = configService.getOrThrow<string>('HOST');

  app.enableCors({
    origin: ALLOWED_ORIGINS === '*' ? true : ALLOWED_ORIGINS.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const majorVersion = packageJson.version.split('.')[0];

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: majorVersion,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new RoleSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Tanta Financial System API')
    .setDescription('The API documentation for the graduation project')
    .setVersion(packageJson.version)
    .addServer('/api')
    .addBearerAuth()
    .addTag('Entry')
    .addTag('Authentication', 'Operations related to authentication')
    .addTag('Departments', 'Manage departments')
    .addTag('Users', 'Operations related to user management and profiles')
    .addTag('Documents', 'Archiving for later use')
    .addTag('Transaction Types', 'Manage types of transactions')
    .addTag('Transactions', 'Manage transactions')
    .addTag('Transaction Forwards', 'Manage transaction forwards')
    .addTag('Budget Categories', 'Manage budget categories')
    .addTag('Notifications', 'Manage notifications')
    .addTag('Lookups', 'System constants and dropdown values')
    .addTag('SSE', 'Server-Sent Events for real-time updates')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: `${SWAGGER_PATH}/json`,
  });

  await app.listen(PORT);

  logger.log(`Running in [${ENV.toUpperCase()}] mode`);
  if (HOST === '0.0.0.0')
    logger.log(`Listening at port: ${PORT} (http://localhost:${PORT})`);
  else logger.log(`Listening at: http://${HOST}:${PORT}`);
  logger.log(`Allowed origins: ${ALLOWED_ORIGINS}`);
}

void bootstrap();
