import { StatusPeriodo } from './enums';

export interface PeriodoLetivo {
  id: string;
  codigo: string;
  ano: number;
  semestre: number;
  descricao: string | null;
  dataInicio: string;
  dataFim: string;
  ativo: boolean;
  status: StatusPeriodo;
}

export interface CriarPeriodoLetivoInput {
  ano: number;
  semestre: number;
  descricao?: string | null;
  dataInicio: string;
  dataFim: string;
  ativo?: boolean;
  status?: StatusPeriodo;
}

export type AtualizarPeriodoLetivoInput = Partial<CriarPeriodoLetivoInput>;

export const PERIODO_LETIVO_REPOSITORY = Symbol('PERIODO_LETIVO_REPOSITORY');
export interface PeriodoLetivoRepository {
  listar(): Promise<PeriodoLetivo[]>;
  buscarPorId(id: string): Promise<PeriodoLetivo | null>;
  criar(input: CriarPeriodoLetivoInput): Promise<PeriodoLetivo>;
  atualizar(
    id: string,
    input: AtualizarPeriodoLetivoInput,
  ): Promise<PeriodoLetivo | null>;
  remover(id: string): Promise<boolean>;
  /**
   * Grava o snapshot da grade pública no momento da publicação. Não faz parte
   * do `PeriodoLetivo` nem do `atualizar()` de propósito: é um blob pesado que
   * ninguém deveria carregar sem pedir explicitamente.
   */
  gravarGradePublicada(
    id: string,
    snapshot: Record<string, unknown>,
  ): Promise<void>;
}
