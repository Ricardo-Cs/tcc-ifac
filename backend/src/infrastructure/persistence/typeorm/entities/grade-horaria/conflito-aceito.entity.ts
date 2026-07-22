import {
    Column,
    Entity,
    ManyToOne,
    Unique,
    type Relation,
    CreateDateColumn,
} from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { AlocacaoAulaEntity } from './alocacao-aula.entity';
import { UsuarioEntity } from '../comum/usuario.entity';
import { SeveridadeConflito, TipoConflito } from './enums';

/**
 * Registra a DECISÃO da comissão de conviver com um conflito específico
 * (com justificativa e autor). NÃO é cache de conflitos calculados —
 * conflito nunca é persistido, é sempre recalculado a partir do estado.
 * Conflitos FORTES não deveriam ser aceitáveis; validar na regra de negócio.
 */
@Entity('conflito_aceito')
@Unique(['alocacao', 'tipo'])
export class ConflitoAceitoEntity extends AbstractEntity {
    @ManyToOne(() => AlocacaoAulaEntity, { nullable: false, onDelete: 'CASCADE' })
    alocacao: Relation<AlocacaoAulaEntity>;

    @Column({ type: 'enum', enum: TipoConflito })
    tipo: TipoConflito;

    @Column({ type: 'enum', enum: SeveridadeConflito })
    severidade: SeveridadeConflito;

    @Column({ type: 'text' })
    justificativa: string;

    @ManyToOne(() => UsuarioEntity, { nullable: false, onDelete: 'RESTRICT' })
    aceitoPor: Relation<UsuarioEntity>;

    @CreateDateColumn({ type: 'timestamptz' })
    aceitoEm: Date;
}