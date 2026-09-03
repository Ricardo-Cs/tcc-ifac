import { GrupoRegime, Modalidade, Turno } from '../academico/enums';
import { construirSnapshot } from './construir-snapshot';
import {
  AlocacaoSnapshot,
  CursoSnapshot,
  DadosSnapshot,
  DisciplinaSnapshot,
  GradeSnapshot,
  Id,
  OfertaSnapshot,
  ParticipacaoProfessor,
  ProfessorSnapshot,
  SalaSnapshot,
  SlotSnapshot,
  TurmaSnapshot,
} from './snapshot';

export function alocacao(
  p: Partial<AlocacaoSnapshot> &
    Pick<AlocacaoSnapshot, 'id' | 'ofertaId' | 'slotId'>,
): AlocacaoSnapshot {
  return { salaId: null, grupoBloco: null, version: 1, ...p };
}

export function oferta(
  p: Partial<Omit<OfertaSnapshot, 'professores'>> &
    Pick<OfertaSnapshot, 'id' | 'turmaId'> & {
      professores?: ParticipacaoProfessor[];
      professorIds?: Id[];
    },
): OfertaSnapshot {
  const { professores, professorIds, ...rest } = p;
  const resolvidos =
    professores ??
    (professorIds ?? []).map((professorId) => ({
      professorId,
      proporcaoCarga: 100,
    }));
  return {
    disciplinaId: `disc-${p.id}`,
    aulasSemana: 2,
    ...rest,
    professores: resolvidos,
  };
}

export function professor(
  p: Partial<ProfessorSnapshot> & Pick<ProfessorSnapshot, 'id'>,
): ProfessorSnapshot {
  return {
    nome: `Prof ${p.id}`,
    grupoRegime: GrupoRegime.G1,
    ajusteCargaHoras: null,
    ajusteCargaMotivo: null,
    ...p,
  };
}

export function turma(
  p: Partial<TurmaSnapshot> & Pick<TurmaSnapshot, 'id'>,
): TurmaSnapshot {
  return {
    nome: `Turma ${p.id}`,
    cursoId: `curso-${p.id}`,
    ...p,
  };
}

export function curso(
  p: Partial<CursoSnapshot> & Pick<CursoSnapshot, 'id'>,
): CursoSnapshot {
  return {
    nome: `Curso ${p.id}`,
    sigla: p.id.toUpperCase(),
    modalidade: Modalidade.SUPERIOR,
    turnoPadrao: Turno.TARDE,
    ...p,
  };
}

export function sala(
  p: Partial<SalaSnapshot> & Pick<SalaSnapshot, 'id'>,
): SalaSnapshot {
  return { nome: `Sala ${p.id}`, ...p };
}

export function disciplina(
  p: Partial<DisciplinaSnapshot> & Pick<DisciplinaSnapshot, 'id'>,
): DisciplinaSnapshot {
  return {
    codigo: p.id,
    nome: `Disciplina ${p.id}`,
    ...p,
  };
}

export function slot(
  p: Partial<SlotSnapshot> & Pick<SlotSnapshot, 'id'>,
): SlotSnapshot {
  return {
    codigo: p.id,
    diaSemana: 1,
    turno: Turno.TARDE,
    ordem: 1,
    horaInicio: '13:30:00',
    horaFim: '14:20:00',
    ...p,
  };
}

function indexar<T extends { id: string }>(itens: T[]): Map<string, T> {
  return new Map(itens.map((i) => [i.id, i]));
}

export function montarSnapshot(entrada: {
  periodoLetivoId?: string;
  alocacoes?: AlocacaoSnapshot[];
  ofertas?: OfertaSnapshot[];
  professores?: ProfessorSnapshot[];
  turmas?: TurmaSnapshot[];
  cursos?: CursoSnapshot[];
  disciplinas?: DisciplinaSnapshot[];
  salas?: SalaSnapshot[];
  slots?: SlotSnapshot[];
  restricoes?: [string, boolean][];
  coletaImportada?: boolean;
}): GradeSnapshot {
  const dados: DadosSnapshot = {
    periodoLetivoId: entrada.periodoLetivoId ?? 'periodo-1',
    alocacoes: entrada.alocacoes ?? [],
    ofertas: indexar(entrada.ofertas ?? []),
    professores: indexar(entrada.professores ?? []),
    turmas: indexar(entrada.turmas ?? []),
    cursos: indexar(entrada.cursos ?? []),
    disciplinas: indexar(entrada.disciplinas ?? []),
    salas: indexar(entrada.salas ?? []),
    slots: indexar(entrada.slots ?? []),
    restricoes: new Map(entrada.restricoes ?? []),
    coletaImportada: entrada.coletaImportada ?? false,
  };
  return construirSnapshot(dados);
}
