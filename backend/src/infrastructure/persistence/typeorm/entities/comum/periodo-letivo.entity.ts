import { Column, Entity, Index, Unique } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { StatusPeriodo } from './enums';

@Entity('periodo_letivo')
@Index(['ativo'], { unique: true, where: 'ativo = true' })
@Unique(['ano', 'semestre'])
export class PeriodoLetivoEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 10, unique: true })
  codigo: string;

  @Column({ type: 'int' })
  ano: number;

  // Junto com `ano`, identifica o período (unique).
  @Column({ type: 'smallint' })
  semestre: number;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'date' })
  dataInicio: string;

  @Column({ type: 'date' })
  dataFim: string;

  @Column({ type: 'boolean', default: false })
  ativo: boolean;

  // Só armazena o estado; a transição para PUBLICADO (zero conflitos FORTES)
  // é regra de domínio.
  @Column({
    type: 'enum',
    enum: StatusPeriodo,
    default: StatusPeriodo.RASCUNHO,
  })
  status: StatusPeriodo;
}
