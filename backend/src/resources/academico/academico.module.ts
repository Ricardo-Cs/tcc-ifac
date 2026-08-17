import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CURSOS_REPOSITORY } from '@domain/academico/curso';
import { DISCIPLINAS_REPOSITORY } from '@domain/academico/disciplina';
import { PROFESSORES_REPOSITORY } from '@domain/academico/professor';
import { CursosService } from '@application/academico/cursos.service';
import { ProfessoresService } from '@application/academico/professores.service';
import { DisciplinasService } from '@application/academico/disciplinas.service';
import { CursoEntity } from '@infrastructure/persistence/typeorm/entities/academico/curso.entity';
import { ProfessorEntity } from '@infrastructure/persistence/typeorm/entities/academico/professor.entity';
import { DisciplinaEntity } from '@infrastructure/persistence/typeorm/entities/academico/disciplina.entity';
import { TypeormCursosRepository } from '@infrastructure/persistence/typeorm/repositories/academico/cursos.repository';
import { TypeormProfessoresRepository } from '@infrastructure/persistence/typeorm/repositories/academico/professores.repository';
import { TypeormDisciplinasRepository } from '@infrastructure/persistence/typeorm/repositories/academico/disciplinas.repository';
import { CursosController } from './cursos/cursos.controller';
import { ProfessoresController } from './professores/professores.controller';
import { DisciplinasController } from './disciplinas/disciplinas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CursoEntity, ProfessorEntity, DisciplinaEntity]),
  ],
  controllers: [CursosController, ProfessoresController, DisciplinasController],
  providers: [
    CursosService,
    ProfessoresService,
    DisciplinasService,
    { provide: CURSOS_REPOSITORY, useClass: TypeormCursosRepository },
    { provide: PROFESSORES_REPOSITORY, useClass: TypeormProfessoresRepository },
    { provide: DISCIPLINAS_REPOSITORY, useClass: TypeormDisciplinasRepository },
  ],
})
export class AcademicoModule {}
