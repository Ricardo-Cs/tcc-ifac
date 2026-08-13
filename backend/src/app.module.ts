import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PersistenceModule } from './infrastructure/persistence/typeorm/typeorm.module';
import { GradeHorariaModule } from './infrastructure/http/grade-horaria/grade-horaria.module';
import { AcademicoModule } from './infrastructure/http/academico/academico.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PersistenceModule,
    AcademicoModule,
    GradeHorariaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
