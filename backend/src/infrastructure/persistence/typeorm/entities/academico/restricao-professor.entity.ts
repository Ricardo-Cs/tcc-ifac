import { Column, Entity, ManyToOne, type Relation, Unique } from "typeorm";
import { AbstractEntity } from "../base-entity";
import { ProfessorEntity } from "./professor.entity";
import { SlotHorarioEntity } from "./slot-horario.entity";
import { PeriodoLetivoEntity } from "../comum/periodo-letivo.entity";
import { ColetaRestricaoEntity } from "./coleta-restricao.entity";

@Entity('restricao_professor')
@Unique(['professor', 'slotHorario', 'periodoLetivo'])
export class RestricaoProfessorEntity extends AbstractEntity {
    @ManyToOne(() => ProfessorEntity, { nullable: false, onDelete: 'CASCADE' })
    professor: Relation<ProfessorEntity>;

    @ManyToOne(() => SlotHorarioEntity, { nullable: false, onDelete: 'CASCADE' })
    slotHorario: Relation<SlotHorarioEntity>;

    @ManyToOne(() => PeriodoLetivoEntity, { nullable: false, onDelete: 'CASCADE' })
    periodoLetivo: Relation<PeriodoLetivoEntity>;

    @ManyToOne(() => ColetaRestricaoEntity, { nullable: false, onDelete: 'CASCADE' })
    coleta: Relation<ColetaRestricaoEntity>;

    @Column({ type: 'text', nullable: true })
    motivo: string | null;
}