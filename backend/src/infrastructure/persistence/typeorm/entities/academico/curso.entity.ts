import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { Modalidade, Turno } from './enums';

@Entity('curso')
export class CursoEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 20 })
  sigla: string;

  @Column({ type: 'enum', enum: Modalidade })
  modalidade: Modalidade;

  @Column({ type: 'enum', enum: Turno })
  turnoPadrao: Turno;

  @Column({ type: 'int', nullable: true })
  cargaHoraria: number | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;
}
