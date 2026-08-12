/**
 * As formas prontas para a tela — o container as monta a partir da `Grade` crua
 * e as entrega aos componentes de apresentação, que só desenham. Manter o cálculo
 * de um lado e o desenho do outro é o que deixa a tabela e o painel burros.
 */
import { Aula, Conflito, Severidade } from '../../core/models/grade.models';

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
