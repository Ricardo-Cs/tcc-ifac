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
 *
 * A identidade do conflito aceito é a `chave` determinística (ver
 * `chaveConflito` no domínio), não uma única alocação: um conflito pode
 * envolver duas alocações (ex.: PROFESSOR_DUPLICADO). É pela `chave` que o
 * serviço, ao reavaliar do zero, reconhece que um conflito recomputado é o
 * mesmo que foi aceito e o remove da lista.
 */
@Entity('conflito_aceito')
@Unique(['chave'])
export class ConflitoAceitoEntity extends AbstractEntity {
    // `${tipo}|${alocacoesEnvolvidas ordenadas}`. Se qualquer aula envolvida for
    // movida, a chave muda e o aceite deixa de casar — o conflito reaparece.
    @Column({ type: 'varchar', length: 512 })
    chave: string;

    // Alocação representante (a primeira da chave ordenada). Não é a identidade;
    // existe para integridade referencial — se ela for removida, o aceite cai
    // junto (CASCADE), e de todo modo a chave já deixaria de casar.
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