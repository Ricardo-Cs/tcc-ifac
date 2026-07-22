import { Column, Entity, ManyToOne, Unique, type Relation } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { TurmaEntity } from './turma.entity';
import { DisciplinaEntity } from './disciplina.entity';
import { PeriodoLetivoEntity } from '../comum/periodo-letivo.entity';

@Entity('oferta_disciplina')
@Unique(['turma', 'disciplina', 'periodoLetivo'])
export class OfertaDisciplinaEntity extends AbstractEntity {
    @ManyToOne(() => TurmaEntity, { nullable: false, onDelete: 'CASCADE' })
    turma: Relation<TurmaEntity>;

    @ManyToOne(() => DisciplinaEntity, { nullable: false, onDelete: 'RESTRICT' })
    disciplina: Relation<DisciplinaEntity>;

    @ManyToOne(() => PeriodoLetivoEntity, { nullable: false, onDelete: 'RESTRICT' })
    periodoLetivo: Relation<PeriodoLetivoEntity>;

    // Quantos slots esta oferta deve ocupar por semana. A carga horária semanal
    // é DERIVADA disto — não se guarda um campo separado de carga, que
    // divergiria com o tempo.
    @Column({ type: 'smallint' })
    aulasSemana: number;

    @Column({ type: 'text', nullable: true })
    observacoes: string | null;
}