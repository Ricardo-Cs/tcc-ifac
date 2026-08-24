export type Modalidade = 'SUPERIOR' | 'INTEGRADO' | 'SUBSEQUENTE';
export type Turno = 'MANHA' | 'TARDE' | 'NOITE';
export type GrupoRegime = 'G1' | 'G2' | 'G3_20H' | 'G3_40H' | 'G2_1' | 'G2_2' | 'G2_3';
export type TipoSala = 'COMUM' | 'LABORATORIO' | 'AUDITORIO' | 'QUADRA';
export type RegimeOferta = 'ANUAL' | 'SEMESTRAL';

// ─────────────────────────────── Curso ────────────────────────────────

export interface Curso {
  id: string;
  nome: string;
  sigla: string;
  modalidade: Modalidade;
  turnoPadrao: Turno;
  cargaHoraria: number | null;
  ativo: boolean;
}

export interface CriarCurso {
  nome: string;
  sigla: string;
  modalidade: Modalidade;
  turnoPadrao: Turno;
  cargaHoraria?: number | null;
  ativo?: boolean;
}

export type AtualizarCurso = Partial<CriarCurso>;

// ───────────────────────────── Professor ──────────────────────────────

export interface Professor {
  id: string;
  nome: string;
  email: string | null;
  siape: string;
  titulacao: string | null;
  grupoRegime: GrupoRegime;
  ajusteCargaHoras: number | null;
  ajusteCargaMotivo: string | null;
  ativo: boolean;
}

export interface CriarProfessor {
  nome: string;
  email?: string | null;
  siape: string;
  titulacao?: string | null;
  grupoRegime: GrupoRegime;
  ajusteCargaHoras?: number | null;
  ajusteCargaMotivo?: string | null;
  ativo?: boolean;
}

export type AtualizarProfessor = Partial<CriarProfessor>;

// ───────────────────────────── Disciplina ─────────────────────────────

export interface Disciplina {
  id: string;
  cursoId: string;
  cursoSigla: string;
  cursoNome: string;
  codigo: string;
  nome: string;
  periodoCurso: number | null;
  cargaHoraria: number;
  tipoSalaRequerido: TipoSala | null;
}

export interface CriarDisciplina {
  cursoId: string;
  codigo: string;
  nome: string;
  periodoCurso?: number | null;
  cargaHoraria: number;
  tipoSalaRequerido?: TipoSala | null;
}

export type AtualizarDisciplina = Partial<CriarDisciplina>;

// ─────────────────────────────── Turma ────────────────────────────────

export interface Turma {
  id: string;
  cursoId: string;
  cursoSigla: string;
  cursoNome: string;
  nome: string;
  semestreEntrada: string;
  quantidadeAlunos: number | null;
  ativa: boolean;
}

export interface CriarTurma {
  cursoId: string;
  nome: string;
  semestreEntrada: string;
  quantidadeAlunos?: number | null;
  ativa?: boolean;
}

export type AtualizarTurma = Partial<CriarTurma>;

// ──────────────────────────────── Sala ────────────────────────────────

export interface Sala {
  id: string;
  nome: string;
  tipo: TipoSala;
  capacidade: number | null;
  ativa: boolean;
}

export interface CriarSala {
  nome: string;
  tipo: TipoSala;
  capacidade?: number | null;
  ativa?: boolean;
}

export type AtualizarSala = Partial<CriarSala>;

// ─────────────────────────────── Oferta ───────────────────────────────

export interface ProfessorDaOferta {
  professorId: string;
  professorNome: string;
  proporcaoCarga: number;
}

export interface Oferta {
  id: string;
  turmaId: string;
  turmaNome: string;
  cursoSigla: string;
  disciplinaId: string;
  disciplinaCodigo: string;
  disciplinaNome: string;
  periodoLetivoId: string;
  periodoCodigo: string;
  regime: RegimeOferta;
  aulasSemana: number;
  observacoes: string | null;
  professores: ProfessorDaOferta[];
}

export interface ProfessorOfertaInput {
  professorId: string;
  proporcaoCarga: number;
}

export interface CriarOferta {
  turmaId: string;
  disciplinaId: string;
  periodoLetivoId: string;
  regime: RegimeOferta;
  aulasSemana: number;
  observacoes?: string | null;
  professores: ProfessorOfertaInput[];
}

export type AtualizarOferta = Partial<CriarOferta>;
