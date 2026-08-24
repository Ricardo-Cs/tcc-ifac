export type Severidade = 'FORTE' | 'POTENCIAL' | 'FRACO';

export interface Disciplina {
  codigo: string;
  nome: string;
}

export interface Slot {
  id: string;
  codigo: string;
  diaSemana: number;
  turno: string;
  ordem: number;
  horaInicio: string;
  horaFim: string;
}

export interface Aula {
  id: string;
  ofertaId: string;
  version: number;
  grupoBloco: string | null;
  disciplina: Disciplina | null;
  turma: string | null;
  turmaId: string | null;
  cursoId: string | null;
  professores: string[];
  sala: string | null;
  salaId: string | null;
  slot: Slot | null;
}

export interface Conflito {
  chave: string;
  tipo: string;
  severidade: Severidade;
  mensagem: string;
  alocacoesEnvolvidas: string[];
  aceitavel: boolean;
}

export interface Curso {
  id: string;
  nome: string;
  sigla: string;
  modalidade: string;
  turnoPadrao: string;
}

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
