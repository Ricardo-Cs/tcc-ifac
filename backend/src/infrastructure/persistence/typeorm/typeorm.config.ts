import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { assertDatabaseEnv, buildDataSourceOptions } from './typeorm-options';

// Registro para o Nest: `TypeOrmModule.forRootAsync(typeOrmAsyncOptions)`.
// Lê via ConfigService (não `process.env` direto) para respeitar o mesmo
// pipeline de configuração do resto da aplicação.
export const typeOrmAsyncOptions: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const env = assertDatabaseEnv({
      DB_HOST: config.get<string>('DB_HOST'),
      DB_PORT: config.get<string>('DB_PORT'),
      DB_USER: config.get<string>('DB_USER'),
      DB_PASSWORD: config.get<string>('DB_PASSWORD'),
      DB_NAME: config.get<string>('DB_NAME'),
      NODE_ENV: config.get<string>('NODE_ENV'),
    });

    return buildDataSourceOptions(env);
  },
};
