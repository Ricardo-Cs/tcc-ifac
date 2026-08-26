import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PERIODO_LETIVO_REPOSITORY } from '@domain/comum/periodo-letivo';
import { PeriodosLetivosService } from '@application/comum/periodos-letivos.service';
import { TravaPublicacaoGuard } from '@application/comum/trava-publicacao.guard';
import { PeriodoLetivoEntity } from '@infrastructure/persistence/typeorm/entities/comum/periodo-letivo.entity';
import { TypeormPeriodosLetivosRepository } from '@infrastructure/persistence/typeorm/repositories/comum/periodos-letivos.repository';
import { GradeHorariaModule } from '@resources/grade-horaria/grade-horaria.module';
import { PeriodosController } from './periodos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PeriodoLetivoEntity]),
    GradeHorariaModule,
  ],
  controllers: [PeriodosController],
  providers: [
    PeriodosLetivosService,
    TravaPublicacaoGuard,
    {
      provide: PERIODO_LETIVO_REPOSITORY,
      useClass: TypeormPeriodosLetivosRepository,
    },
  ],
})
export class PeriodosModule {}
