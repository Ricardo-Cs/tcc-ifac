import { Column, Entity, ManyToOne, Unique, type Relation } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { CursoEntity } from './curso.entity';
import { TipoSala } from './enums';
import { numericTransformer } from '../../transformers/numeric.transformer';

@Entity('disciplina')
@Unique(['curso', 'codigo'])
export class DisciplinaEntity extends AbstractEntity {
  @ManyToOne(() => CursoEntity, { nullable: false, onDelete: 'RESTRICT' })
  curso: Relation<CursoEntity>;

  @Column({ type: 'varchar', length: 20 })
  codigo: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'smallint', nullable: true })
  periodoCurso: number | null;

  @Column({
    type: 'numeric',
    precision: 7,
    scale: 2,
    transformer: numericTransformer,
  })
  cargaHoraria: number;

  @Column({ type: 'enum', enum: TipoSala, nullable: true })
  tipoSalaRequerido: TipoSala | null;
}
