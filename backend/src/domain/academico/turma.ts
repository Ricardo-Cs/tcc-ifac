import { Modalidade } from './enums';

export interface Turma {
  id: string;
  cursoId: string;
  cursoSigla: string;
  cursoNome: string;
  cursoModalidade: Modalidade;
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
  atualizar(id: string, input: AtualizarTurmaInput): Promise<Turma | null>;
  remover(id: string): Promise<boolean>;
}
