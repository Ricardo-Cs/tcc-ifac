import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:4200',
  });

  // ValidationPipe global: os DTOs (class-validator) passam a valer para todas
  // as rotas. `whitelist` descarta propriedades não declaradas no DTO;
  // `forbidNonWhitelisted` rejeita a requisição que as envie (erro cedo, em vez
  // de silenciosamente ignorar); `transform` converte o payload cru na
  // instância do DTO (e aplica coerção de tipos dos @Type/params).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Chronos API')
    .setDescription(
      'API do Chronos — apoio à decisão para montagem de grade horária do ' +
      'IFAC (campus Rio Branco). Cadastros acadêmicos e motor de conflitos.',
    )
    .setVersion('1.0')
    .addTag('cursos', 'Cadastro de cursos')
    .addTag('professores', 'Cadastro de professores')
    .addTag('disciplinas', 'Cadastro de disciplinas')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
