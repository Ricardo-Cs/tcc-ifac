import { Column, Entity, ManyToOne, Unique, type Relation } from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { PeriodoLetivoEntity } from '../comum/periodo-letivo.entity';
import { UsuarioEntity } from '../comum/usuario.entity';

/**
 * Uma coleta por período letivo — corresponde a UMA importação da planilha
 * gerada pelo Google Forms respondido pelos professores.
 *
 * Existência da coleta = "o formulário deste período já foi importado".
 * É o que habilita o terceiro estado do sistema: sem coleta, as restrições
 * ainda não entraram, e o motor de conflitos opera em modo de aviso em vez
 * de acusar conflito.
 *
 * Reimportação: apagar a coleta remove em cascata todas as restrições do
 * período (onDelete CASCADE do lado da RestricaoProfessor), permitindo
 * reimportar a planilha inteira quando vier corrigida.
 */
@Entity('coleta_restricao')
@Unique(['periodoLetivo'])
export class ColetaRestricaoEntity extends AbstractEntity {
  @ManyToOne(() => PeriodoLetivoEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  periodoLetivo: Relation<PeriodoLetivoEntity>;

  @Column({ type: 'timestamptz' })
  importadoEm: Date;

  @ManyToOne(() => UsuarioEntity, { nullable: false, onDelete: 'RESTRICT' })
  importadoPor: Relation<UsuarioEntity>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  arquivoOrigem: string | null;
}
