import { Column, Entity, ManyToOne, type Relation, Unique } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { CursoEntity } from './curso.entity';
import { DisciplinaEntity } from './disciplina.entity';

@Entity('curso_disciplina')
@Unique(['curso', 'disciplina', 'periodo'])
export class CursoDisciplinaEntity extends AbstractEntity {
  @ManyToOne(() => CursoEntity, { nullable: false, onDelete: 'CASCADE' })
  curso: Relation<CursoEntity>;

  @ManyToOne(() => DisciplinaEntity, { nullable: false, onDelete: 'RESTRICT' })
  disciplina: Relation<DisciplinaEntity>;

  @Column({ type: 'smallint' })
  periodo: number;
}
