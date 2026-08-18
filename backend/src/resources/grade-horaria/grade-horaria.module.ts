import { Module } from '@nestjs/common';
import { AvaliarGradeUseCase } from '@application/grade-horaria/avaliar-grade.use-case';
import { AlterarAlocacaoUseCase } from '@application/grade-horaria/alterar-alocacao.use-case';
import { AceitarConflitoUseCase } from '@application/grade-horaria/aceitar-conflito.use-case';
import {
  ACEITES_REPOSITORY,
  ALOCACOES_REPOSITORY,
  PERIODOS_REPOSITORY,
  REGRAS,
  Regras,
  SNAPSHOT_LOADER,
  USUARIOS_REPOSITORY,
} from '@domain/grade-horaria/ports';
import { SqlSnapshotLoader } from '@infrastructure/persistence/sql/snapshot.loader';
import { SqlAceitesRepository } from '@infrastructure/persistence/sql/aceites.repository';
import { SqlPeriodosRepository } from '@infrastructure/persistence/sql/periodos.repository';
import { SqlAlocacoesRepository } from '@infrastructure/persistence/sql/alocacoes.repository';
import { SqlUsuariosRepository } from '@infrastructure/persistence/sql/usuarios.repository';
import { RegraProfessorDuplicado } from '@domain/grade-horaria/regras/professor-duplicado';
import { RegraTurmaDuplicada } from '@domain/grade-horaria/regras/turma-duplicada';
import { RegraSalaOcupada } from '@domain/grade-horaria/regras/sala-ocupada';
import { GradeController } from './grade.controller';

/**
 * Onde a aplicação encontra suas implementações: cada porta (Symbol) é ligada à
 * classe de `infrastructure/persistence/sql` que a satisfaz. A lista de regras
 * é injetada como valor — acrescentar uma regra nova ao motor é editar só este
 * array. O `DataSource` vem do `TypeOrmModule` global (registrado no boot).
 */
@Module({
  controllers: [GradeController],
  providers: [
    AvaliarGradeUseCase,
    AlterarAlocacaoUseCase,
    AceitarConflitoUseCase,
    { provide: SNAPSHOT_LOADER, useClass: SqlSnapshotLoader },
    { provide: ACEITES_REPOSITORY, useClass: SqlAceitesRepository },
    { provide: PERIODOS_REPOSITORY, useClass: SqlPeriodosRepository },
    { provide: ALOCACOES_REPOSITORY, useClass: SqlAlocacoesRepository },
    { provide: USUARIOS_REPOSITORY, useClass: SqlUsuariosRepository },
    {
      provide: REGRAS,
      useValue: [
        new RegraProfessorDuplicado(),
        new RegraTurmaDuplicada(),
        new RegraSalaOcupada(),
      ] satisfies Regras,
    },
  ],
})
export class GradeHorariaModule {}
