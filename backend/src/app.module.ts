import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PersistenceModule } from './infrastructure/persistence/typeorm/typeorm.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true
  }),
    PersistenceModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
