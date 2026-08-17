import { GrupoRegime } from './enums';

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
