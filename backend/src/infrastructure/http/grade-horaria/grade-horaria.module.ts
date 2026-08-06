import { Module } from '@nestjs/common';
import { AvaliarGradeService } from '../../../application/grade-horaria/avaliar-grade.service';
import { AlterarAlocacaoService } from '../../../application/grade-horaria/alterar-alocacao.service';
import { AceitarConflitoService } from '../../../application/grade-horaria/aceitar-conflito.service';
import {
  ACEITES_REPOSITORY,
  ALOCACOES_REPOSITORY,
  PERIODOS_REPOSITORY,
  REGRAS,
  Regras,
  SNAPSHOT_LOADER,
  USUARIOS_REPOSITORY,
} from '../../../application/grade-horaria/ports';
import { SqlSnapshotLoader } from '../../persistence/sql/snapshot.loader';
import { SqlAceitesRepository } from '../../persistence/sql/aceites.repository';
import { SqlPeriodosRepository } from '../../persistence/sql/periodos.repository';
import { SqlAlocacoesRepository } from '../../persistence/sql/alocacoes.repository';
import { SqlUsuariosRepository } from '../../persistence/sql/usuarios.repository';
import { RegraProfessorDuplicado } from '../../../domain/grade-horaria/regras/professor-duplicado';
import { RegraTurmaDuplicada } from '../../../domain/grade-horaria/regras/turma-duplicada';
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
    AvaliarGradeService,
    AlterarAlocacaoService,
    AceitarConflitoService,
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
      ] satisfies Regras,
    },
  ],
})
export class GradeHorariaModule {}
