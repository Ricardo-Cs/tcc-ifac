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
  turma: string | null;
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

export interface Grade {
  periodoLetivoId: string;
  coletaImportada: boolean;
  aulas: Aula[];
  slots: Slot[];
  conflitos: Conflito[];
}

export interface Periodo {
  id: string;
  codigo: string;
  descricao: string | null;
  status: string;
  ativo: boolean;
}
