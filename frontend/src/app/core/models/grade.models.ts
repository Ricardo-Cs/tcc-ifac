/**
 * Espelho do contrato HTTP servido por `GradeController` (backend). Mantido em
 * sincronia manual com `infrastructure/http/grade-horaria/grade.view.ts` — a
 * interface consome exatamente estes campos, com os nomes já resolvidos pelo
 * servidor (disciplina, professores, sala), sem tocar no domínio cru.
 */

export type Severidade = 'FORTE' | 'POTENCIAL' | 'FRACO';

export interface Disciplina {
  codigo: string;
  nome: string;
}

export interface Slot {
  id: string;
  codigo: string;
  /** 1 = Segunda … 5 = Sexta. */
  diaSemana: number;
  turno: string;
  /** Posição da aula dentro do turno (1..5 na TARDE). */
  ordem: number;
  /** Faixa horária no formato "HH:MM:SS". */
  horaInicio: string;
  horaFim: string;
}

export interface Aula {
  id: string;
  ofertaId: string;
  grupoBloco: string | null;
  disciplina: Disciplina | null;
  /** Nome da turma — o rótulo impresso no cartão da aula. */
  turma: string | null;
  /**
   * Turma da aula — é por ela que a grade se separa DE FATO: um curso tem
   * várias turmas no mesmo período (SI tem 1º, 3º e 6º ao mesmo tempo), cada
   * uma com sua grade. Rótulo em `Grade.turmas`.
   */
  turmaId: string | null;
  /** Curso da turma — o primeiro nível do recorte. Rótulo em `Grade.cursos`. */
  cursoId: string | null;
  professores: string[];
  sala: string | null;
  slot: Slot | null;
}

export interface Conflito {
  /** Identidade semântica estável — usada ao registrar o aceite. */
  chave: string;
  tipo: string;
  severidade: Severidade;
  mensagem: string;
  /** Ids das linhas de alocação que a interface destaca. */
  alocacoesEnvolvidas: string[];
  /** FORTE nunca é aceitável — o servidor já resolve; a UI só esconde o botão. */
  aceitavel: boolean;
}

/** Um curso com oferta no período — cada um rende uma visão da grade. */
export interface Curso {
  id: string;
  nome: string;
  sigla: string;
  modalidade: string;
  /** Turno em que o curso funciona; define as faixas exibidas na grade dele. */
  turnoPadrao: string;
}

/** Uma turma com oferta no período — é dela a grade que o aluno recebe. */
export interface Turma {
  id: string;
  nome: string;
  cursoId: string;
}

export interface Grade {
  periodoLetivoId: string;
  coletaImportada: boolean;
  aulas: Aula[];
  slots: Slot[];
  cursos: Curso[];
  turmas: Turma[];
  conflitos: Conflito[];
}

export interface Periodo {
  id: string;
  codigo: string;
  descricao: string | null;
  status: string;
  ativo: boolean;
}

/**
 * Uma oferta que ainda tem aula a pôr na grade — item do catálogo do qual a
 * comissão arrasta uma disciplina para uma célula vazia. Espelha
 * `OfertaAlocavelView` do backend. `aulasRestantes` é sempre > 0 (o servidor já
 * filtra as ofertas completas).
 */
export interface OfertaAlocavel {
  ofertaId: string;
  turmaId: string | null;
  turma: string | null;
  cursoId: string | null;
  disciplina: Disciplina | null;
  professores: string[];
  aulasSemana: number;
  aulasAlocadas: number;
  aulasRestantes: number;
}
