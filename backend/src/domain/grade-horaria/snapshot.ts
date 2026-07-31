/**
 * Estrutura em memória do estado de um período letivo. TypeScript puro — sem
 * TypeORM, sem NestJS, sem `infrastructure`.
 *
 * A ideia central: carregar o período inteiro UMA vez, com índices
 * pré-computados, e rodar todas as regras contra ela. Cada regra vira varredura
 * de Map, sem tocar no banco. Um período do campus são alguns milhares de
 * alocações — cabe em memória sem esforço.
 *
 * Turno e tipo de sala entram tipados pelos enums do domínio (não `string`):
 * as regras comparam igualdade, então o compilador precisa pegar um
 * desalinhamento — do contrário viraria falso negativo silencioso.
 */
import { TipoSala, Turno } from '../academico/enums';

export type Id = string;

/** Uma aula concreta na grade: uma linha por slot ocupado. */
export interface AlocacaoSnapshot {
    id: Id;
    ofertaId: Id;
    slotId: Id;
    /** Null quando a alocação ainda não tem sala definida. */
    salaId: Id | null;
    /** Aulas geminadas compartilham o mesmo valor; null = aula avulsa. */
    grupoBloco: string | null;
}

export interface OfertaSnapshot {
    id: Id;
    turmaId: Id;
    disciplinaId: Id;
    /** Quantos slots esta oferta deve ocupar por semana. */
    aulasSemana: number;
    /** Professores já resolvidos. Mais de um = codocência. */
    professorIds: Id[];
}

export interface ProfessorSnapshot {
    id: Id;
    nome: string;
    maxAulasSemanais: number;
}

export interface TurmaSnapshot {
    id: Id;
    nome: string;
    quantidadeAlunos: number | null;
}

export interface SalaSnapshot {
    id: Id;
    nome: string;
    tipo: TipoSala;
    capacidade: number | null;
}

export interface DisciplinaSnapshot {
    id: Id;
    codigo: string;
    nome: string;
    /** Null = a disciplina não exige tipo específico de sala. */
    tipoSalaRequerido: TipoSala | null;
}

export interface SlotSnapshot {
    id: Id;
    codigo: string;
    diaSemana: number;
    turno: Turno;
    ordem: number;
}

/** Chave composta professor+slot, usada em índices e no conjunto de restrições. */
export function chaveProfessorSlot(professorId: Id, slotId: Id): string {
    return `${professorId}:${slotId}`;
}

/** Chave composta turma+slot. */
export function chaveTurmaSlot(turmaId: Id, slotId: Id): string {
    return `${turmaId}:${slotId}`;
}

/** Os dados brutos do período; os índices são derivados destes. */
export interface DadosSnapshot {
    periodoLetivoId: Id;
    alocacoes: AlocacaoSnapshot[];
    ofertas: Map<Id, OfertaSnapshot>;
    professores: Map<Id, ProfessorSnapshot>;
    turmas: Map<Id, TurmaSnapshot>;
    disciplinas: Map<Id, DisciplinaSnapshot>;
    salas: Map<Id, SalaSnapshot>;
    slots: Map<Id, SlotSnapshot>;
    /**
     * Restrições declaradas pelos professores no formulário. Presença da chave
     * `${professorId}:${slotId}` = o professor marcou que NÃO pode nesse slot.
     */
    restricoes: Set<string>;
    /**
     * A coleta do formulário deste período foi importada? Habilita o terceiro
     * estado: sem coleta, restrições ainda não entraram e o motor opera em modo
     * de aviso em vez de acusar RESTRICAO_VIOLADA.
     */
    coletaImportada: boolean;
}

/**
 * O estado completo em memória: dados brutos + índices pré-computados. É o que
 * deixa as regras baratas — cada uma varre o índice que lhe interessa.
 */
export interface GradeSnapshot extends DadosSnapshot {
    /** Alocações agrupadas por slot. */
    porSlot: Map<Id, AlocacaoSnapshot[]>;
    /** Alocações agrupadas por `${professorId}:${slotId}` (via oferta). */
    porProfessorSlot: Map<string, AlocacaoSnapshot[]>;
    /** Alocações agrupadas por `${turmaId}:${slotId}` (via oferta). */
    porTurmaSlot: Map<string, AlocacaoSnapshot[]>;
}
