import { Column, Entity } from "typeorm";
import { AbstractEntity } from "../base-entity";
import { TipoSala } from "./enums";

@Entity('sala')
export class SalaEntity extends AbstractEntity {

    @Column({ type: 'varchar', length: 100, unique: true })
    nome: string;

    @Column({ type: 'enum', enum: TipoSala, default: TipoSala.COMUM })
    tipo: TipoSala;

    @Column({ type: 'int', nullable: true })
    capacidade: number | null;

    @Column({ type: 'boolean', default: true })
    ativa: boolean;
}