/**
 * Helpers para montar snapshots literais nos testes. Não é código de produção —
 * só existe para deixar os testes das regras triviais de escrever e ler.
 */
import { TipoSala, Turno } from '../academico/enums';
import { construirSnapshot } from './construir-snapshot';
import {
    AlocacaoSnapshot,
    DadosSnapshot,
    DisciplinaSnapshot,
    GradeSnapshot,
    OfertaSnapshot,
    ProfessorSnapshot,
    SalaSnapshot,
    SlotSnapshot,
    TurmaSnapshot,
} from './snapshot';

export function alocacao(p: Partial<AlocacaoSnapshot> & Pick<AlocacaoSnapshot, 'id' | 'ofertaId' | 'slotId'>): AlocacaoSnapshot {
    return { salaId: null, grupoBloco: null, ...p };
}

export function oferta(p: Partial<OfertaSnapshot> & Pick<OfertaSnapshot, 'id' | 'turmaId'>): OfertaSnapshot {
    return { disciplinaId: `disc-${p.id}`, aulasSemana: 2, professorIds: [], ...p };
}

export function professor(p: Partial<ProfessorSnapshot> & Pick<ProfessorSnapshot, 'id'>): ProfessorSnapshot {
    return { nome: `Prof ${p.id}`, maxAulasSemanais: 20, ...p };
}

export function turma(p: Partial<TurmaSnapshot> & Pick<TurmaSnapshot, 'id'>): TurmaSnapshot {
    return { nome: `Turma ${p.id}`, quantidadeAlunos: null, ...p };
}

export function sala(p: Partial<SalaSnapshot> & Pick<SalaSnapshot, 'id'>): SalaSnapshot {
    return { nome: `Sala ${p.id}`, tipo: TipoSala.COMUM, capacidade: null, ...p };
}

export function disciplina(p: Partial<DisciplinaSnapshot> & Pick<DisciplinaSnapshot, 'id'>): DisciplinaSnapshot {
    return { codigo: p.id, nome: `Disciplina ${p.id}`, tipoSalaRequerido: null, ...p };
}

export function slot(p: Partial<SlotSnapshot> & Pick<SlotSnapshot, 'id'>): SlotSnapshot {
    return { codigo: p.id, diaSemana: 1, turno: Turno.TARDE, ordem: 1, ...p };
}

function indexar<T extends { id: string }>(itens: T[]): Map<string, T> {
    return new Map(itens.map((i) => [i.id, i]));
}

/**
 * Monta um GradeSnapshot a partir de listas soltas. Preenche os mapas e deixa a
 * fábrica computar os índices. Campos omitidos assumem defaults sensatos.
 */
export function montarSnapshot(entrada: {
    periodoLetivoId?: string;
    alocacoes?: AlocacaoSnapshot[];
    ofertas?: OfertaSnapshot[];
    professores?: ProfessorSnapshot[];
    turmas?: TurmaSnapshot[];
    disciplinas?: DisciplinaSnapshot[];
    salas?: SalaSnapshot[];
    slots?: SlotSnapshot[];
    restricoes?: string[];
    coletaImportada?: boolean;
}): GradeSnapshot {
    const dados: DadosSnapshot = {
        periodoLetivoId: entrada.periodoLetivoId ?? 'periodo-1',
        alocacoes: entrada.alocacoes ?? [],
        ofertas: indexar(entrada.ofertas ?? []),
        professores: indexar(entrada.professores ?? []),
        turmas: indexar(entrada.turmas ?? []),
        disciplinas: indexar(entrada.disciplinas ?? []),
        salas: indexar(entrada.salas ?? []),
        slots: indexar(entrada.slots ?? []),
        restricoes: new Set(entrada.restricoes ?? []),
        coletaImportada: entrada.coletaImportada ?? false,
    };
    return construirSnapshot(dados);
}
