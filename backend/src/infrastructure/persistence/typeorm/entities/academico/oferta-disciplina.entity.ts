import { Column, Entity, ManyToOne, Unique, type Relation } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { TurmaEntity } from './turma.entity';
import { DisciplinaEntity } from './disciplina.entity';
import { PeriodoLetivoEntity } from '../comum/periodo-letivo.entity';
import { SalaEntity } from './sala.entity';
import { RegimeOferta } from './enums';

@Entity('oferta_disciplina')
@Unique(['turma', 'disciplina', 'periodoLetivo'])
export class OfertaDisciplinaEntity extends AbstractEntity {
  @ManyToOne(() => TurmaEntity, { nullable: false, onDelete: 'CASCADE' })
  turma: Relation<TurmaEntity>;

  @ManyToOne(() => DisciplinaEntity, { nullable: false, onDelete: 'RESTRICT' })
  disciplina: Relation<DisciplinaEntity>;

  @ManyToOne(() => PeriodoLetivoEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  periodoLetivo: Relation<PeriodoLetivoEntity>;

  @Column({ type: 'enum', enum: RegimeOferta })
  regime: RegimeOferta;

  @Column({ type: 'smallint' })
  aulasSemana: number;

  @ManyToOne(() => SalaEntity, { nullable: true, onDelete: 'SET NULL' })
  sala: Relation<SalaEntity> | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;
}
