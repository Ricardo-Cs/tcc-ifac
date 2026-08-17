// ─────────────────────────────── Turma ────────────────────────────────
// Turma pertence a um curso (curso › turma). O período atual é DERIVADO do
// semestre de entrada, não armazenado — por isso o modelo carrega só o
// `semestreEntrada` (ingresso). O curso entra no registro plano já resolvido
// (id + sigla + nome) para a listagem exibir sem um segundo request.

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

export interface CriarTurmaInput {
  cursoId: string;
  nome: string;
  semestreEntrada: string;
  quantidadeAlunos?: number | null;
  ativa?: boolean;
}

export type AtualizarTurmaInput = Partial<CriarTurmaInput>;

export const TURMAS_REPOSITORY = Symbol('TURMAS_REPOSITORY');
export interface TurmasRepository {
  listar(): Promise<Turma[]>;
  buscarPorId(id: string): Promise<Turma | null>;
  criar(input: CriarTurmaInput): Promise<Turma>;
  /** `null` quando não existe turma com esse id. */
  atualizar(id: string, input: AtualizarTurmaInput): Promise<Turma | null>;
  /** `false` quando não existe turma com esse id. */
  remover(id: string): Promise<boolean>;
}
