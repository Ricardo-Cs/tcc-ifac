import { Check, Column, Entity, Unique } from "typeorm";
import { AbstractEntity } from "../base-entity";
import { Turno } from "./enums";

@Entity('slot_horario')
@Unique(['diaSemana', 'turno', 'ordem'])
@Check(`"dia_semana" BETWEEN 1 AND 6`)
export class SlotHorarioEntity extends AbstractEntity {
    @Column({ type: 'varchar', unique: true, length: 10 })
    codigo: string;

    @Column({ type: 'smallint' })
    diaSemana: number;

    @Column({ type: 'enum', enum: Turno })
    turno: Turno;

    @Column({ type: 'smallint' })
    ordem: number;

    @Column({ type: 'time' })
    horaInicio: string;

    @Column({ type: 'time' })
    horaFim: string;
}