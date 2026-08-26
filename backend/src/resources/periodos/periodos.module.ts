import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PERIODO_LETIVO_REPOSITORY } from '@domain/comum/periodo-letivo';
import { PeriodosLetivosService } from '@application/comum/periodos-letivos.service';
import { PeriodoLetivoEntity } from '@infrastructure/persistence/typeorm/entities/comum/periodo-letivo.entity';
import { TypeormPeriodosLetivosRepository } from '@infrastructure/persistence/typeorm/repositories/comum/periodos-letivos.repository';
import { PeriodosController } from './periodos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodoLetivoEntity])],
  controllers: [PeriodosController],
  providers: [
    PeriodosLetivosService,
    {
      provide: PERIODO_LETIVO_REPOSITORY,
      useClass: TypeormPeriodosLetivosRepository,
    },
  ],
})
export class PeriodosModule {}
