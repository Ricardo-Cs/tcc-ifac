// Consumido pelo CLI do TypeORM (`typeorm-ts-node-commonjs`), que roda fora do
// Nest: sem ConfigModule, sem DI. Por isso carrega o .env por conta própria.
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { assertDatabaseEnv, buildDataSourceOptions } from './typeorm-options';

const env = assertDatabaseEnv(process.env);

export const AppDataSource = new DataSource(buildDataSourceOptions(env));
