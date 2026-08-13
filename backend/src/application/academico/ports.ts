import {
  GrupoRegime,
  Modalidade,
  TipoSala,
  Turno,
} from '../../domain/academico/enums';

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

export interface CriarCursoInput {
  nome: string;
  sigla: string;
  modalidade: Modalidade;
  turnoPadrao: Turno;
  cargaHoraria?: number | null;
  ativo?: boolean;
}

export type AtualizarCursoInput = Partial<CriarCursoInput>;

export const CURSOS_REPOSITORY = Symbol('CURSOS_REPOSITORY');
export interface CursosRepository {
  listar(): Promise<Curso[]>;
  buscarPorId(id: string): Promise<Curso | null>;
  criar(input: CriarCursoInput): Promise<Curso>;
  /** `null` quando não existe curso com esse id. */
  atualizar(id: string, input: AtualizarCursoInput): Promise<Curso | null>;
  /** `false` quando não existe curso com esse id. */
  remover(id: string): Promise<boolean>;
}

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

export interface CriarProfessorInput {
  nome: string;
  email?: string | null;
  siape: string;
  titulacao?: string | null;
  grupoRegime: GrupoRegime;
  ajusteCargaHoras?: number | null;
  ajusteCargaMotivo?: string | null;
  ativo?: boolean;
}

export type AtualizarProfessorInput = Partial<CriarProfessorInput>;

export const PROFESSORES_REPOSITORY = Symbol('PROFESSORES_REPOSITORY');
export interface ProfessoresRepository {
  listar(): Promise<Professor[]>;
  buscarPorId(id: string): Promise<Professor | null>;
  criar(input: CriarProfessorInput): Promise<Professor>;
  atualizar(
    id: string,
    input: AtualizarProfessorInput,
  ): Promise<Professor | null>;
  remover(id: string): Promise<boolean>;
}

// ───────────────────────────── Disciplina ─────────────────────────────

export interface Disciplina {
  id: string;
  codigo: string;
  nome: string;
  cargaHoraria: number;
  tipoSalaRequerido: TipoSala | null;
}

export interface CriarDisciplinaInput {
  codigo: string;
  nome: string;
  cargaHoraria: number;
  tipoSalaRequerido?: TipoSala | null;
}

export type AtualizarDisciplinaInput = Partial<CriarDisciplinaInput>;

export const DISCIPLINAS_REPOSITORY = Symbol('DISCIPLINAS_REPOSITORY');
export interface DisciplinasRepository {
  listar(): Promise<Disciplina[]>;
  buscarPorId(id: string): Promise<Disciplina | null>;
  criar(input: CriarDisciplinaInput): Promise<Disciplina>;
  atualizar(
    id: string,
    input: AtualizarDisciplinaInput,
  ): Promise<Disciplina | null>;
  remover(id: string): Promise<boolean>;
}
