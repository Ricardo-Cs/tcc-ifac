import { TipoSala } from './enums';

// ──────────────────────────────── Sala ────────────────────────────────
// Espaço físico onde uma aula pode ser alocada. `nome` é único; `tipo` casa
// com o `tipoSalaRequerido` da disciplina (informação para a comissão, não
// bloqueio — Chronos não impede alocar fora do tipo).

export interface Sala {
  id: string;
  nome: string;
  tipo: TipoSala;
  capacidade: number | null;
  ativa: boolean;
}

export interface CriarSalaInput {
  nome: string;
  tipo: TipoSala;
  capacidade?: number | null;
  ativa?: boolean;
}

export type AtualizarSalaInput = Partial<CriarSalaInput>;

export const SALAS_REPOSITORY = Symbol('SALAS_REPOSITORY');
export interface SalasRepository {
  listar(): Promise<Sala[]>;
  buscarPorId(id: string): Promise<Sala | null>;
  criar(input: CriarSalaInput): Promise<Sala>;
  /** `null` quando não existe sala com esse id. */
  atualizar(id: string, input: AtualizarSalaInput): Promise<Sala | null>;
  /** `false` quando não existe sala com esse id. */
  remover(id: string): Promise<boolean>;
}
