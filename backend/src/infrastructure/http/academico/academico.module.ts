import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CURSOS_REPOSITORY,
  DISCIPLINAS_REPOSITORY,
  PROFESSORES_REPOSITORY,
} from '../../../application/academico/ports';
import { CursosService } from '../../../application/academico/cursos.service';
import { ProfessoresService } from '../../../application/academico/professores.service';
import { DisciplinasService } from '../../../application/academico/disciplinas.service';
import { CursoEntity } from '../../persistence/typeorm/entities/academico/curso.entity';
import { ProfessorEntity } from '../../persistence/typeorm/entities/academico/professor.entity';
import { DisciplinaEntity } from '../../persistence/typeorm/entities/academico/disciplina.entity';
import { TypeormCursosRepository } from '../../persistence/typeorm/repositories/academico/cursos.repository';
import { TypeormProfessoresRepository } from '../../persistence/typeorm/repositories/academico/professores.repository';
import { TypeormDisciplinasRepository } from '../../persistence/typeorm/repositories/academico/disciplinas.repository';
import { CursosController } from './cursos.controller';
import { ProfessoresController } from './professores.controller';
import { DisciplinasController } from './disciplinas.controller';

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
export class AcademicoModule { }
