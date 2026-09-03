import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { GrupoRegime } from './enums';

@Entity('professor')
export class ProfessorEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, unique: true })
  identificador: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  titulacao: string | null;

  @Column({ type: 'enum', enum: GrupoRegime, nullable: true })
  grupoRegime: GrupoRegime | null;

  @Column({ type: 'int', nullable: true })
  ajusteCargaHoras: number | null;

  @Column({ type: 'text', nullable: true })
  ajusteCargaMotivo: string | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;
}
