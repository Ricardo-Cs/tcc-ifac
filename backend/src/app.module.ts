import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PersistenceModule } from './infrastructure/persistence/typeorm/typeorm.module';
import { GradeHorariaModule } from './infrastructure/http/grade-horaria/grade-horaria.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PersistenceModule,
    GradeHorariaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
