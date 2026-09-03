import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CURSOS_REPOSITORY } from '@domain/academico/curso';
import { DISCIPLINAS_REPOSITORY } from '@domain/academico/disciplina';
import { PROFESSORES_REPOSITORY } from '@domain/academico/professor';
import { TURMAS_REPOSITORY } from '@domain/academico/turma';
import { SALAS_REPOSITORY } from '@domain/academico/sala';
import { OFERTAS_REPOSITORY } from '@domain/academico/oferta';
import { COLETAS_RESTRICAO_REPOSITORY } from '@domain/academico/coleta-restricao';
import { RESTRICOES_PROFESSOR_REPOSITORY } from '@domain/academico/restricao-professor';
import { CursosService } from '@application/academico/cursos.service';
import { ProfessoresService } from '@application/academico/professores.service';
import { ImportarProfessoresUseCase } from '@application/academico/importar-professores.use-case';
import { DisciplinasService } from '@application/academico/disciplinas.service';
import { TurmasService } from '@application/academico/turmas.service';
import { SalasService } from '@application/academico/salas.service';
import { OfertasService } from '@application/academico/ofertas.service';
import { ColetasRestricaoService } from '@application/academico/coletas-restricao.service';
import { RestricoesProfessorService } from '@application/academico/restricoes-professor.service';
import { CursoEntity } from '@infrastructure/persistence/typeorm/entities/academico/curso.entity';
import { ProfessorEntity } from '@infrastructure/persistence/typeorm/entities/academico/professor.entity';
import { DisciplinaEntity } from '@infrastructure/persistence/typeorm/entities/academico/disciplina.entity';
import { TurmaEntity } from '@infrastructure/persistence/typeorm/entities/academico/turma.entity';
import { SalaEntity } from '@infrastructure/persistence/typeorm/entities/academico/sala.entity';
import { OfertaDisciplinaEntity } from '@infrastructure/persistence/typeorm/entities/academico/oferta-disciplina.entity';
import { ProfessorOfertaEntity } from '@infrastructure/persistence/typeorm/entities/academico/professor-oferta.entity';
import { ColetaRestricaoEntity } from '@infrastructure/persistence/typeorm/entities/academico/coleta-restricao.entity';
import { RestricaoProfessorEntity } from '@infrastructure/persistence/typeorm/entities/academico/restricao-professor.entity';
import { TypeormCursosRepository } from '@infrastructure/persistence/typeorm/repositories/academico/cursos.repository';
import { TypeormProfessoresRepository } from '@infrastructure/persistence/typeorm/repositories/academico/professores.repository';
import { TypeormDisciplinasRepository } from '@infrastructure/persistence/typeorm/repositories/academico/disciplinas.repository';
import { TypeormTurmasRepository } from '@infrastructure/persistence/typeorm/repositories/academico/turmas.repository';
import { TypeormSalasRepository } from '@infrastructure/persistence/typeorm/repositories/academico/salas.repository';
import { TypeormOfertasRepository } from '@infrastructure/persistence/typeorm/repositories/academico/ofertas.repository';
import { TypeormColetasRestricaoRepository } from '@infrastructure/persistence/typeorm/repositories/academico/coletas-restricao.repository';
import { TypeormRestricoesProfessorRepository } from '@infrastructure/persistence/typeorm/repositories/academico/restricoes-professor.repository';
import { GradeHorariaModule } from '@resources/grade-horaria/grade-horaria.module';
import { CursosController } from './cursos/cursos.controller';
import { ProfessoresController } from './professores/professores.controller';
import { DisciplinasController } from './disciplinas/disciplinas.controller';
import { TurmasController } from './turmas/turmas.controller';
import { SalasController } from './salas/salas.controller';
import { OfertasController } from './ofertas/ofertas.controller';
import { ColetasRestricaoController } from './coletas-restricao/coletas-restricao.controller';
import { RestricoesProfessorController } from './restricoes-professor/restricoes-professor.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CursoEntity,
      ProfessorEntity,
      DisciplinaEntity,
      TurmaEntity,
      SalaEntity,
      OfertaDisciplinaEntity,
      ProfessorOfertaEntity,
      ColetaRestricaoEntity,
      RestricaoProfessorEntity,
    ]),
    GradeHorariaModule,
  ],
  controllers: [
    CursosController,
    ProfessoresController,
    DisciplinasController,
    TurmasController,
    SalasController,
    OfertasController,
    ColetasRestricaoController,
    RestricoesProfessorController,
  ],
  providers: [
    CursosService,
    ProfessoresService,
    ImportarProfessoresUseCase,
    DisciplinasService,
    TurmasService,
    SalasService,
    OfertasService,
    ColetasRestricaoService,
    RestricoesProfessorService,
    { provide: CURSOS_REPOSITORY, useClass: TypeormCursosRepository },
    { provide: PROFESSORES_REPOSITORY, useClass: TypeormProfessoresRepository },
    { provide: DISCIPLINAS_REPOSITORY, useClass: TypeormDisciplinasRepository },
    { provide: TURMAS_REPOSITORY, useClass: TypeormTurmasRepository },
    { provide: SALAS_REPOSITORY, useClass: TypeormSalasRepository },
    { provide: OFERTAS_REPOSITORY, useClass: TypeormOfertasRepository },
    {
      provide: COLETAS_RESTRICAO_REPOSITORY,
      useClass: TypeormColetasRestricaoRepository,
    },
    {
      provide: RESTRICOES_PROFESSOR_REPOSITORY,
      useClass: TypeormRestricoesProfessorRepository,
    },
  ],
})
export class AcademicoModule {}
