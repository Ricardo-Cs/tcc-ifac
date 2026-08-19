/**
 * As formas prontas para a tela — o container as monta a partir da `Grade` crua
 * e as entrega aos componentes de apresentação, que só desenham. Manter o cálculo
 * de um lado e o desenho do outro é o que deixa a tabela e o painel burros.
 */
import { Aula, Conflito, Severidade, Slot } from '../../core/models/grade.models';
import { SEVERIDADE_RANK } from './severidade';

/**
 * Visão "todos os cursos" — a grade inteira do campus numa tabela só. Não é o
 * padrão (a comissão monta um curso de cada vez), mas é onde se enxerga o que
 * atravessa cursos: o professor que dá aula em dois deles.
 */
export const TODOS_OS_CURSOS = '__todos__';

/**
 * Visão "todas as turmas do curso" — as três grades de SI (1º, 3º, 6º) na mesma
 * tabela. Serve para enxergar o que atravessa turmas do mesmo curso (o professor
 * que dá aula em duas delas, a sala disputada).
 */
export const TODAS_AS_TURMAS = '__todas__';

export const DIAS = [
  { num: 1, nome: 'Segunda' },
  { num: 2, nome: 'Terça' },
  { num: 3, nome: 'Quarta' },
  { num: 4, nome: 'Quinta' },
  { num: 5, nome: 'Sexta' },
];

export const TURNO_RANK: Record<string, number> = { MANHA: 0, TARDE: 1, NOITE: 2 };
export const TURNO_ROTULO: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
};

/** "13:30:00" → "13:30". */
export function hhmm(hora: string): string {
  return hora?.slice(0, 5) ?? '';
}

/** Chave de célula na grade — `${dia}-${turno}-${ordem}`, usada no realce de alvo. */
export function chaveCelula(dia: number, turno: string, ordem: number): string {
  return `${dia}-${turno}-${ordem}`;
}

/** Uma aula já com o que o cartão precisa além dela mesma. */
export interface AulaVm {
  aula: Aula;
  /** Pior severidade que a toca — governa a cor do cartão. */
  severidade: Severidade | null;
  /** Sigla do curso; só preenchida (e exibida) na visão "todos os cursos". */
  sigla: string | null;
}

/** Uma célula da tabela: o cruzamento de um dia com uma faixa de horário. */
export interface CelulaVm {
  dia: number;
  turno: string;
  ordem: number;
  aulas: AulaVm[];
}

/** Uma linha da tabela: a faixa de horário e suas cinco células (Seg–Sex). */
export interface LinhaVm {
  turnoRotulo: string;
  /** Faixa horária já formatada ("13:30 – 14:20"). */
  faixa: string;
  celulas: CelulaVm[];
  /**
   * Primeira linha de um turno que vem depois de outro — a tabela desenha um
   * respiro antes dela, separando manhã/tarde/noite visualmente. Falso na
   * primeira linha da grade (não há turno anterior de que se separar).
   */
  iniciaTurno: boolean;
}

/** Um conflito já com as turmas de fora resolvidas para o painel. */
export interface ConflitoVm {
  conflito: Conflito;
  /**
   * Nomes das turmas envolvidas que NÃO estão na tabela em exibição — de outro
   * período do mesmo curso ou de outro curso.
   */
  outrasTurmas: string[];
}

/** De onde o painel de conflitos está falando — governa cabeçalho e mensagem vazia. */
export interface EscopoConflitos {
  nivel: 'turma' | 'curso' | 'todos';
  /** Nome da turma ou sigla do curso; `null` na visão "todos". */
  rotulo: string | null;
}

/**
 * Pior severidade que toca cada aula (id da alocação → severidade) — governa a
 * cor do cartão. Uma aula em vários conflitos fica com a mais grave (o menor
 * rank). Compartilhada entre o planejamento e as consultas de grade.
 */
export function mapaSeveridadePorAula(conflitos: Conflito[]): Map<string, Severidade> {
  const mapa = new Map<string, Severidade>();
  for (const c of conflitos) {
    for (const id of c.alocacoesEnvolvidas) {
      const atual = mapa.get(id);
      if (atual === undefined || SEVERIDADE_RANK[c.severidade] < SEVERIDADE_RANK[atual]) {
        mapa.set(id, c.severidade);
      }
    }
  }
  return mapa;
}

/**
 * Monta as linhas da tabela (uma por turno×ordem) a partir de um conjunto de
 * aulas. Função pura, compartilhada pela grade de planejamento e pelas consultas
 * (por professor, por sala): todas desenham a MESMA tabela, mudando só o recorte
 * de aulas que entra aqui. `turnos` limita quais faixas aparecem (`null` = todas
 * as presentes nos slots). A faixa horária de cada linha vem de qualquer slot
 * dela — todos compartilham o horário.
 */
export function montarLinhas(
  aulas: Aula[],
  slots: Slot[],
  severidadePorAula: Map<string, Severidade>,
  siglaPorCurso: Map<string, string>,
  turnos: Set<string> | null,
): LinhaVm[] {
  const slotPorCelula = new Map<string, Slot>();
  for (const s of slots) {
    slotPorCelula.set(chaveCelula(s.diaSemana, s.turno, s.ordem), s);
  }

  const aulasPorSlot = new Map<string, Aula[]>();
  for (const a of aulas) {
    if (!a.slot) continue;
    const lista = aulasPorSlot.get(a.slot.id) ?? [];
    lista.push(a);
    aulasPorSlot.set(a.slot.id, lista);
  }

  const aulaVm = (aula: Aula): AulaVm => ({
    aula,
    severidade: severidadePorAula.get(aula.id) ?? null,
    sigla: aula.cursoId ? (siglaPorCurso.get(aula.cursoId) ?? null) : null,
  });

  // Linhas distintas (turno, ordem) dos slots visíveis, ordenadas.
  const vistas = new Map<string, { turno: string; ordem: number }>();
  for (const s of slots) {
    if (turnos && !turnos.has(s.turno)) continue;
    const chave = `${s.turno}-${s.ordem}`;
    if (!vistas.has(chave)) vistas.set(chave, { turno: s.turno, ordem: s.ordem });
  }
  const ordenadas = [...vistas.values()].sort(
    (a, b) => (TURNO_RANK[a.turno] ?? 9) - (TURNO_RANK[b.turno] ?? 9) || a.ordem - b.ordem,
  );

  let turnoAnterior: string | null = null;
  return ordenadas.map(({ turno, ordem }) => {
    const celulas: CelulaVm[] = DIAS.map((dia) => {
      const slot = slotPorCelula.get(chaveCelula(dia.num, turno, ordem));
      const aulasDaCelula = slot ? (aulasPorSlot.get(slot.id) ?? []).map(aulaVm) : [];
      return { dia: dia.num, turno, ordem, aulas: aulasDaCelula };
    });
    const modelo = slotPorCelula.get(chaveCelula(DIAS[0].num, turno, ordem));
    const faixa = modelo ? `${hhmm(modelo.horaInicio)} – ${hhmm(modelo.horaFim)}` : '';
    const iniciaTurno = turnoAnterior !== null && turno !== turnoAnterior;
    turnoAnterior = turno;
    return { turnoRotulo: TURNO_ROTULO[turno] ?? turno, faixa, celulas, iniciaTurno };
  });
}
