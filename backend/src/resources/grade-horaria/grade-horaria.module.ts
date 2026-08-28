import { Module } from '@nestjs/common';
import { AvaliarGradeUseCase } from '@application/grade-horaria/avaliar-grade.use-case';
import { AlterarAlocacaoUseCase } from '@application/grade-horaria/alterar-alocacao.use-case';
import { AceitarConflitoUseCase } from '@application/grade-horaria/aceitar-conflito.use-case';
import { ListarOfertasAlocaveisUseCase } from '@application/grade-horaria/listar-ofertas-alocaveis.use-case';
import { PeriodoEditavelGuard } from '@application/grade-horaria/periodo-editavel.guard';
import { AvaliarGradeConflitoForteChecker } from '@application/grade-horaria/conflito-forte-checker';
import { SnapshotCargaLetivaProvider } from '@application/grade-horaria/carga-letiva-provider';
import {
  ACEITES_REPOSITORY,
  ALOCACOES_REPOSITORY,
  PERIODOS_REPOSITORY,
  REGRAS,
  Regras,
  SNAPSHOT_LOADER,
} from '@domain/grade-horaria/ports';
import { CONFLITOS_PERIODO_CHECKER } from '@domain/comum/trava-publicacao';
import { CARGA_LETIVA_PROVIDER } from '@domain/academico/carga-letiva';
import { SqlSnapshotLoader } from '@infrastructure/persistence/sql/snapshot.loader';
import { SqlAceitesRepository } from '@infrastructure/persistence/sql/aceites.repository';
import { SqlPeriodosRepository } from '@infrastructure/persistence/sql/periodos.repository';
import { SqlAlocacoesRepository } from '@infrastructure/persistence/sql/alocacoes.repository';
import { RegraProfessorDuplicado } from '@domain/grade-horaria/regras/professor-duplicado';
import { RegraTurmaDuplicada } from '@domain/grade-horaria/regras/turma-duplicada';
import { RegraSalaOcupada } from '@domain/grade-horaria/regras/sala-ocupada';
import { RegraInterjornada } from '@domain/grade-horaria/regras/interjornada';
import { RegraIntrajornada } from '@domain/grade-horaria/regras/intrajornada';
import { RegraTresTurnosNoDia } from '@domain/grade-horaria/regras/tres-turnos-no-dia';
import { RegraCargaDiariaExcedida } from '@domain/grade-horaria/regras/carga-diaria-excedida';
import { GradeController } from './grade.controller';

@Module({
  controllers: [GradeController],
  providers: [
    AvaliarGradeUseCase,
    AlterarAlocacaoUseCase,
    AceitarConflitoUseCase,
    ListarOfertasAlocaveisUseCase,
    PeriodoEditavelGuard,
    { provide: SNAPSHOT_LOADER, useClass: SqlSnapshotLoader },
    { provide: ACEITES_REPOSITORY, useClass: SqlAceitesRepository },
    { provide: PERIODOS_REPOSITORY, useClass: SqlPeriodosRepository },
    { provide: ALOCACOES_REPOSITORY, useClass: SqlAlocacoesRepository },
    {
      provide: CONFLITOS_PERIODO_CHECKER,
      useClass: AvaliarGradeConflitoForteChecker,
    },
    {
      provide: CARGA_LETIVA_PROVIDER,
      useClass: SnapshotCargaLetivaProvider,
    },
    {
      provide: REGRAS,
      useValue: [
        new RegraProfessorDuplicado(),
        new RegraTurmaDuplicada(),
        new RegraSalaOcupada(),
        new RegraInterjornada(),
        new RegraIntrajornada(),
        new RegraTresTurnosNoDia(),
        new RegraCargaDiariaExcedida(),
      ] satisfies Regras,
    },
  ],
  exports: [
    CONFLITOS_PERIODO_CHECKER,
    CARGA_LETIVA_PROVIDER,
    AvaliarGradeUseCase,
  ],
})
export class GradeHorariaModule {}
