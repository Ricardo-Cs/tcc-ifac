import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { TipoSala } from './enums';

@Entity('disciplina')
export class DisciplinaEntity extends AbstractEntity {
    @Column({ type: 'varchar', length: 20, unique: true })
    codigo: string;

    @Column({ type: 'varchar', length: 255 })
    nome: string;

    @Column({ type: 'int' })
    cargaHoraria: number;

    @Column({ type: 'enum', enum: TipoSala, nullable: true })
    tipoSalaRequerido: TipoSala | null;
}
