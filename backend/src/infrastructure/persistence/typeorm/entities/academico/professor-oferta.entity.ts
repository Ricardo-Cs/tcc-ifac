import { Entity, ManyToOne, Unique, type Relation } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { ProfessorEntity } from './professor.entity';
import { OfertaDisciplinaEntity } from './oferta-disciplina.entity';

@Entity('professor_oferta')
@Unique(['professor', 'oferta'])
export class ProfessorOfertaEntity extends AbstractEntity {
    @ManyToOne(() => ProfessorEntity, { nullable: false, onDelete: 'CASCADE' })
    professor: Relation<ProfessorEntity>;

    @ManyToOne(() => OfertaDisciplinaEntity, { nullable: false, onDelete: 'CASCADE' })
    oferta: Relation<OfertaDisciplinaEntity>;
}