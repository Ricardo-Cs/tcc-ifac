import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '../base-entity';

@Entity('periodo_letivo')
@Index(['ativo'], { unique: true, where: 'ativo = true' })
export class PeriodoLetivoEntity extends AbstractEntity {
    @Column({ type: 'varchar', length: 10, unique: true })
    codigo: string;

    @Column({ type: 'text', nullable: true })
    descricao: string | null;

    @Column({ type: 'date' })
    dataInicio: string;

    @Column({ type: 'date' })
    dataFim: string;

    @Column({ type: 'boolean', default: false })
    ativo: boolean;
}