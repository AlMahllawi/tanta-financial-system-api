import * as packageJson from '../package.json';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_PATH } from './common/constants/app.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Tanta Financial System API')
    .setDescription('The API documentation for the graduation project')
    .setVersion(packageJson.version)
    .addTag('Entry')
    .addTag('Users', 'Operations related to user management and profiles')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
