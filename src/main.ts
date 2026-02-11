import packageJson from '../package.json' with { type: 'json' };
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_PATH } from './common/constants/app.constants.js';
import {
  Logger,
  VersioningType,
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const ALLOWED_ORIGINS = configService
    .get<string>('ALLOWED_ORIGINS', '*')
    .split(',');
  const PORT = configService.get<number>('PORT', 3000);
  const ENV = configService.get<string>('NODE_ENV', 'development');
  const HOST = configService.get<string>('HOST', '0.0.0.0');

  app.enableCors({
    origin: ALLOWED_ORIGINS,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    // credentials: true, // TODO
  });

  app.setGlobalPrefix('api', {
    exclude: ['/', SWAGGER_PATH],
  });

  const majorVersion = packageJson.version.split('.')[0];

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: majorVersion,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Tanta Financial System API')
    .setDescription('The API documentation for the graduation project')
    .setVersion(packageJson.version)
    .addTag('Entry')
    .addTag('Departments', 'Manage departments')
    .addTag('Users', 'Operations related to user management and profiles')
    .addTag('Documents', 'Archiving for later use')
    .addTag('Transaction Types', 'Manage types of transactions')
    .addTag('Transactions', 'Manage transactions')
    .addTag('Transaction Forwards', 'Manage transaction forwards')
    .addTag('Lookups', 'System constants and dropdown values')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document);

  await app.listen(PORT);

  logger.log(`Running in [${ENV.toUpperCase()}] mode`);
  if (HOST === '0.0.0.0')
    logger.log(`Listening at port: ${PORT} (http://localhost:${PORT})`);
  else logger.log(`Listening at: http://${HOST}:${PORT}`);
  logger.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
}

void bootstrap();
