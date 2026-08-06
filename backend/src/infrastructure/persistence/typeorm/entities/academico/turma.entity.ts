import { Column, Entity, ManyToOne, type Relation } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { CursoEntity } from './curso.entity';

@Entity('turma')
export class TurmaEntity extends AbstractEntity {
  @ManyToOne(() => CursoEntity, { nullable: false, onDelete: 'RESTRICT' })
  curso: Relation<CursoEntity>;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  // Semestre de INGRESSO (ex.: "2024.1"). O período atual da turma é
  // derivado depois — não armazenado, para não precisar incrementar a cada
  // semestre e não corromper relatórios históricos.
  @Column({ type: 'varchar', length: 10 })
  semestreEntrada: string;

  @Column({ type: 'int', nullable: true })
  quantidadeAlunos: number | null;

  @Column({ type: 'boolean', default: true })
  ativa: boolean;
}
