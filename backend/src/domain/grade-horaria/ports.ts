import { DadosSnapshot, GradeSnapshot, Id } from './snapshot';
import { Regra } from './regras/regra';

export const SNAPSHOT_LOADER = Symbol('SNAPSHOT_LOADER');
export interface SnapshotLoader {
  carregar(periodoLetivoId: string): Promise<DadosSnapshot>;
}

export interface RegistrarAceiteInput {
  chave: string;
  alocacaoId: string;
  justificativa: string;
  aceitoPorId: string;
}

export const ACEITES_REPOSITORY = Symbol('ACEITES_REPOSITORY');
export interface AceitesRepository {
  chavesDoPeriodo(periodoLetivoId: string): Promise<Set<string>>;
  registrar(input: RegistrarAceiteInput): Promise<void>;
}

export interface CriarAlocacaoInput {
  ofertaId: string;
  slotHorarioId: string;
  salaId?: string | null;
  grupoBloco?: string | null;
  observacoes?: string | null;
  criadoPorId: string;
}

export interface MoverAlocacaoInput {
  slotHorarioId?: string;
  salaId?: string | null;
  versaoBase?: number;
}

export interface OfertaParaAlocacao {
  periodoLetivoId: string;
  salaPadraoId: string | null;
}

export interface AlocacaoAlterada {
  id: string;
  periodoLetivoId: string;
}

export const ALOCACOES_REPOSITORY = Symbol('ALOCACOES_REPOSITORY');
export interface AlocacoesRepository {
  criar(input: CriarAlocacaoInput): Promise<AlocacaoAlterada>;
  mover(id: string, input: MoverAlocacaoInput): Promise<AlocacaoAlterada>;
  remover(id: string, versaoBase?: number): Promise<AlocacaoAlterada>;
  ofertaParaAlocacao(ofertaId: string): Promise<OfertaParaAlocacao | null>;
  periodoDaAlocacao(id: string): Promise<string | null>;
}

export interface PeriodoPublicadoResumo {
  codigo: string;
  descricao: string | null;
  ano: number;
  semestre: number;
  dataInicio: string;
  dataFim: string;
}

export const PERIODOS_REPOSITORY = Symbol('PERIODOS_REPOSITORY');
export interface PeriodosRepository {
  ativoId(): Promise<string | null>;
  snapshotPublicadoPorCodigo(
    codigo: string,
  ): Promise<Record<string, unknown> | null>;
  listarPublicados(): Promise<PeriodoPublicadoResumo[]>;
}

export const REGRAS = Symbol('REGRAS');
export type Regras = Regra[];

export interface PropostaAlocacao {
  ofertaId: Id;
  slotHorarioId: Id;
}

export const GERADOR_GRADE_INICIAL = Symbol('GERADOR_GRADE_INICIAL');
export interface GeradorGradeInicial {
  gerar(snapshot: GradeSnapshot): PropostaAlocacao[];
}
