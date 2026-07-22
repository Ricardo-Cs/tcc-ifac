import {
    Column,
    Entity,
    ManyToOne,
    Index,
    type Relation,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { AbstractEntity } from '../base-entity';
import { OfertaDisciplinaEntity } from '../academico/oferta-disciplina.entity';
import { SlotHorarioEntity } from '../academico/slot-horario.entity';
import { SalaEntity } from '../academico/sala.entity';
import { PeriodoLetivoEntity } from '../comum/periodo-letivo.entity';
import { UsuarioEntity } from '../comum/usuario.entity';

/**
 * Tabela central: uma aula concreta na grade. UMA LINHA POR SLOT OCUPADO —
 * aula geminada de duas aulas são dois registros ligados pelo mesmo
 * `grupoBloco`. Isso mantém a detecção de conflito como igualdade de
 * slot, sem expandir e comparar intervalos.
 *
 * DUAS AUSÊNCIAS DELIBERADAS:
 *
 * 1. Não referencia professor. A oferta pode ter vários professores
 *    (codocência) e não se sabe qual dá aula quando; apontar para um seria
 *    inventar informação. O professor é alcançado via oferta -> professorOferta.
 *
 * 2. NÃO há UNIQUE em (slot, sala) nem (slot, professor). É intencional:
 *    alocação conflitante é um estado VÁLIDO e persistível. O Chronos é
 *    ferramenta de apoio à decisão — registra o que a comissão decidir e
 *    sinaliza o conflito, sem bloquear. Um UNIQUE aqui contrariaria a proposta.
 */
@Entity('alocacao_aula')
@Index(['periodoLetivo', 'slotHorario'])
@Index(['oferta'])
export class AlocacaoAulaEntity extends AbstractEntity {
    @ManyToOne(() => OfertaDisciplinaEntity, { nullable: false, onDelete: 'CASCADE' })
    oferta: Relation<OfertaDisciplinaEntity>;

    @ManyToOne(() => SlotHorarioEntity, { nullable: false, onDelete: 'RESTRICT' })
    slotHorario: Relation<SlotHorarioEntity>;

    @ManyToOne(() => SalaEntity, { nullable: true, onDelete: 'SET NULL' })
    sala: Relation<SalaEntity> | null;

    // Redundante em relação à oferta (desnormalização deliberada): toda consulta
    // do motor de conflitos filtra por período, e a coluna evita um join em cada
    // uma. Consistência garantida na camada de aplicação.
    @ManyToOne(() => PeriodoLetivoEntity, { nullable: false, onDelete: 'RESTRICT' })
    periodoLetivo: Relation<PeriodoLetivoEntity>;

    // Aulas geminadas compartilham o mesmo valor — permite mover o bloco inteiro
    // na interface. Null = aula avulsa.
    @Column({ type: 'uuid', nullable: true })
    grupoBloco: string | null;

    @Column({ type: 'text', nullable: true })
    observacoes: string | null;

    @ManyToOne(() => UsuarioEntity, { nullable: false, onDelete: 'RESTRICT' })
    criadoPor: Relation<UsuarioEntity>;

    @CreateDateColumn({ type: 'timestamptz' })
    criadoEm: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    atualizadoEm: Date;
}