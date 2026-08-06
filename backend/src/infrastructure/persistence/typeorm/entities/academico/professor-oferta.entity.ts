import { Column, Entity, ManyToOne, Unique, type Relation } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { ProfessorEntity } from './professor.entity';
import { OfertaDisciplinaEntity } from './oferta-disciplina.entity';
import { numericTransformer } from '../../transformers/numeric.transformer';

@Entity('professor_oferta')
@Unique(['professor', 'oferta'])
export class ProfessorOfertaEntity extends AbstractEntity {
  @ManyToOne(() => ProfessorEntity, { nullable: false, onDelete: 'CASCADE' })
  professor: Relation<ProfessorEntity>;

  @ManyToOne(() => OfertaDisciplinaEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  oferta: Relation<OfertaDisciplinaEntity>;

  // Percentual da carga do professor nesta oferta (codocência). Preenchimento
  // manual. Invariante: a soma das proporções de uma mesma oferta = 100 —
  // validada no domínio, não como constraint no banco.
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    transformer: numericTransformer,
  })
  proporcaoCarga: number;
}
