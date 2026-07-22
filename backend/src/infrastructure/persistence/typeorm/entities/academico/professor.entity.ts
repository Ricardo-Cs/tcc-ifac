import { Column, Entity } from "typeorm";
import { AbstractEntity } from "../base-entity";

@Entity('professor')
export class ProfessorEntity extends AbstractEntity {
    @Column({ type: 'varchar', length: 255 })
    nome: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string | null;

    @Column({ type: 'varchar', length: 8, unique: true })
    siape: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    titulacao: string | null;

    @Column({ type: 'int', default: 20 })
    maxAulasSemanais: number;

    @Column({ type: 'boolean', default: true })
    ativo: boolean;
}