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

/**
 * Registra a DECISÃO da comissão de conviver com um conflito específico
 * (com justificativa e autor). NÃO é cache de conflitos calculados —
 * conflito nunca é persistido, é sempre recalculado a partir do estado.
 * Conflitos FORTES não são aceitáveis; a invariante é validada no domínio
 * (`chaveDoAceite`), então nem chegam a virar linha aqui.
 *
 * A identidade do aceite é a `chave` semântica (ver `chaveConflito` no
 * domínio): `tipo :: contexto :: participantes(oferta+slot[+sala]) ordenados`.
 * NÃO usa o id da linha de alocação — mover uma aula é um UPDATE que preserva o
 * id; se a chave usasse o id, o aceite grudaria na aula no slot errado. É pela
 * `chave` que o serviço, ao reavaliar do zero, reconhece que um conflito
 * recomputado é o mesmo que foi aceito e o remove da lista.
 *
 * `tipo` e `severidade` NÃO são colunas: `tipo` já está embutido na `chave`, e
 * `severidade` é volátil de propósito (o mesmo conflito muda de severidade
 * conforme o contexto) — persisti-la seria gravar um valor que envelhece.
 */
@Entity('conflito_aceito')
@Unique(['chave'])
export class ConflitoAceitoEntity extends AbstractEntity {
    // `tipo :: contexto :: participantes ordenados`. Se qualquer aula envolvida
    // for movida, o slot muda, a chave muda e o aceite deixa de casar — o
    // conflito reaparece para nova avaliação.
    @Column({ type: 'varchar', length: 512 })
    chave: string;

    // Alocação representante — NÃO é a identidade (essa é a `chave`). Existe só
    // como gancho de limpeza em cascata: apagar a aula apaga o aceite (CASCADE).
    // Se, em vez de apagada, a aula for movida, a `chave` já deixa de casar e o
    // aceite fica inerte de qualquer forma.
    @ManyToOne(() => AlocacaoAulaEntity, { nullable: false, onDelete: 'CASCADE' })
    alocacao: Relation<AlocacaoAulaEntity>;

    @Column({ type: 'text' })
    justificativa: string;

    @ManyToOne(() => UsuarioEntity, { nullable: false, onDelete: 'RESTRICT' })
    aceitoPor: Relation<UsuarioEntity>;

    @CreateDateColumn({ type: 'timestamptz' })
    aceitoEm: Date;
}
