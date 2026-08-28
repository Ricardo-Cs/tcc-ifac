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

export interface ProfessorCarga {
  nome: string;
  cargaHorariaAtual: number;
}

export interface Grade {
  periodoLetivoId: string;
  coletaImportada: boolean;
  aulas: Aula[];
  slots: Slot[];
  cursos: Curso[];
  turmas: Turma[];
  professores: ProfessorCarga[];
  conflitos: Conflito[];
}

export type StatusPeriodo = 'RASCUNHO' | 'VALIDADO' | 'PUBLICADO';

export interface Periodo {
  id: string;
  codigo: string;
  ano: number;
  semestre: number;
  descricao: string | null;
  dataInicio: string;
  dataFim: string;
  status: StatusPeriodo;
  ativo: boolean;
}

export interface CriarPeriodo {
  ano: number;
  semestre: number;
  descricao?: string | null;
  dataInicio: string;
  dataFim: string;
  status?: StatusPeriodo;
  ativo?: boolean;
}

export type AtualizarPeriodo = Partial<CriarPeriodo>;

export interface PeriodoPublicado {
  codigo: string;
  descricao: string | null;
  ano: number;
  semestre: number;
  dataInicio: string;
  dataFim: string;
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
