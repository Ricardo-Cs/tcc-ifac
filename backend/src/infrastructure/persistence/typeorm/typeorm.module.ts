import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncOptions } from './typeorm.config';

@Module({
  imports: [TypeOrmModule.forRootAsync(typeOrmAsyncOptions)],
})
export class PersistenceModule {}
