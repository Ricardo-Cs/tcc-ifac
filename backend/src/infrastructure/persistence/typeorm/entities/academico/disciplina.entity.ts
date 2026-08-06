import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { TipoSala } from './enums';
import { numericTransformer } from '../../transformers/numeric.transformer';

@Entity('disciplina')
export class DisciplinaEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  // Horas de 60 min (unidade canônica; as aulas de 50 min são derivadas).
  // numeric porque valores como 133,33 não cabem em int.
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
