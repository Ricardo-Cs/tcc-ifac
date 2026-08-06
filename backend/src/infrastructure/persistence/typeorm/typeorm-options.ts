import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy';

export const REQUIRED_DB_ENV_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
] as const;

export interface DatabaseEnv {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  nodeEnv: string;
}

// Ponto único de validação: chamado tanto pelo data-source.ts (CLI, env via
// dotenv) quanto pelo typeorm.config.ts (Nest, env via ConfigService), para
// que faltar uma variável falhe do mesmo jeito nos dois caminhos.
export function assertDatabaseEnv(
  env: Record<string, string | undefined>,
): DatabaseEnv {
  const missing = REQUIRED_DB_ENV_VARS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Configuração de banco incompleta: variável(is) de ambiente ausente(s): ${missing.join(', ')}.`,
    );
  }

  return {
    host: env.DB_HOST as string,
    port: Number(env.DB_PORT),
    username: env.DB_USER as string,
    password: env.DB_PASSWORD as string,
    database: env.DB_NAME as string,
    nodeEnv: env.NODE_ENV ?? 'development',
  };
}

// Fonte única das opções de conexão. data-source.ts (CLI) e typeorm.config.ts
// (Nest) chamam esta função para não duplicar host/porta/credenciais/glob em
// dois arquivos que precisariam ser mantidos em sincronia manualmente.
//
// entities/migrations são resolvidos por glob relativo a __dirname: como
// data-source.ts, typeorm.config.ts e este arquivo moram no mesmo diretório,
// o caminho resolvido é idêntico nos dois pontos de entrada.
export function buildDataSourceOptions(env: DatabaseEnv): DataSourceOptions {
  const isProduction = env.nodeEnv === 'production';

  return {
    type: 'postgres',
    host: env.host,
    port: env.port,
    username: env.username,
    password: env.password,
    database: env.database,
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: true,
    migrationsRun: false,
    entities: [__dirname + '/entities/**/*.entity.{ts,js}'],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    logging: isProduction ? ['error'] : ['query', 'error'],
  };
}
