import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { GrupoRegime } from './enums';

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

  // Substitui o antigo maxAulasSemanais: o grupo de regime (RAD, Arts. 14-15)
  // define a FAIXA de carga (piso/teto). Sem default — todo professor tem um
  // regime conhecido no cadastro, não há caso típico a mascarar. A faixa em si
  // é tabela de referência no domínio, não coluna.
  @Column({ type: 'enum', enum: GrupoRegime })
  grupoRegime: GrupoRegime;

  // Redução individual de carga (doença, gestão, projetos, stricto-sensu) que a
  // comissão aplica e anota. Ausente = sem ajuste. Pareia com o motivo abaixo:
  // um ajuste sem justificativa é dado incompleto (a coerência é regra de
  // negócio, não da entidade — aqui os dois são nullable independentes).
  @Column({ type: 'int', nullable: true })
  ajusteCargaHoras: number | null;

  @Column({ type: 'text', nullable: true })
  ajusteCargaMotivo: string | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;
}
