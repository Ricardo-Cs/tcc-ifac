import { TipoSala } from './enums';

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
