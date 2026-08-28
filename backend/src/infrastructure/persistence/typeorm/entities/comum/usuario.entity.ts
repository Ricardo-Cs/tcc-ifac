import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { PapelUsuario } from './enums';

@Entity('usuario')
export class UsuarioEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  senha: string;

  @Column({ type: 'enum', enum: PapelUsuario, default: PapelUsuario.CONSULTA })
  papel: PapelUsuario;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'boolean', default: true })
  senhaProvisoria: boolean;
}
