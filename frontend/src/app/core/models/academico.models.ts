export type Modalidade = 'SUPERIOR' | 'INTEGRADO' | 'SUBSEQUENTE';
export type Turno = 'MANHA' | 'TARDE' | 'NOITE';
export type GrupoRegime =
  | 'G1'
  | 'G2'
  | 'G3_20H'
  | 'G3_40H'
  | 'G2_1'
  | 'G2_2'
  | 'G2_3';
export type TipoSala = 'COMUM' | 'LABORATORIO' | 'AUDITORIO' | 'QUADRA';

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
  codigo: string;
  nome: string;
  cargaHoraria: number;
  tipoSalaRequerido: TipoSala | null;
}

export interface CriarDisciplina {
  codigo: string;
  nome: string;
  cargaHoraria: number;
  tipoSalaRequerido?: TipoSala | null;
}

export type AtualizarDisciplina = Partial<CriarDisciplina>;
