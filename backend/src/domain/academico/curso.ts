import { Modalidade, Turno } from './enums';

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
