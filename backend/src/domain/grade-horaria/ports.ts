/**
 * Portas (interfaces) do motor de conflitos. O domínio declara AQUI o que
 * precisa carregar/gravar, mas continua puro: não sabe *como* — depende
 * DESTAS interfaces, nunca de implementações concretas de `infrastructure`.
 * A camada de aplicação orquestra sobre elas; a ligação (qual classe de
 * `infrastructure` satisfaz cada porta) é feita no módulo Nest, por token de
 * injeção. Assim o domínio + a orquestração continuam testáveis sem banco:
 * basta uma implementação em memória das portas.
 */
import { DadosSnapshot } from './snapshot';
import { Regra } from './regras/regra';

/** Carrega o estado bruto de um período letivo para alimentar o motor. */
export const SNAPSHOT_LOADER = Symbol('SNAPSHOT_LOADER');
export interface SnapshotLoader {
  carregar(periodoLetivoId: string): Promise<DadosSnapshot>;
}

/** Dados para gravar o aceite de um conflito. */
export interface RegistrarAceiteInput {
  /** Identidade semântica do conflito (ver `chaveConflito`). */
  chave: string;
  /** Alocação representante — só gancho de CASCADE, não é a identidade. */
  alocacaoId: string;
  justificativa: string;
  aceitoPorId: string;
}

/** Lê e grava decisões de aceite. */
export const ACEITES_REPOSITORY = Symbol('ACEITES_REPOSITORY');
export interface AceitesRepository {
  /**
   * As `chave`s (identidade estável do conflito) aceitas cujo aceite pertence a
   * uma alocação do período. É por essa chave que o orquestrador reconhece um
   * conflito recomputado como "já decidido pela comissão".
   */
  chavesDoPeriodo(periodoLetivoId: string): Promise<Set<string>>;
  /** Grava o aceite; idempotente por `chave` (aceitar duas vezes não duplica). */
  registrar(input: RegistrarAceiteInput): Promise<void>;
}

/** Dados para criar uma alocação. O período é DERIVADO da oferta (não vem do
 * cliente): a coluna `periodo_letivo_id` é desnormalização da oferta, e derivá-la
 * no servidor evita que as duas divirjam. */
export interface CriarAlocacaoInput {
  ofertaId: string;
  slotHorarioId: string;
  salaId?: string | null;
  grupoBloco?: string | null;
  observacoes?: string | null;
  criadoPorId: string;
}

/** Mover uma aula: UPDATE que PRESERVA o id (é o que faz a chave do conflito
 * expirar quando o slot muda). Campos ausentes ficam como estavam; `salaId: null`
 * limpa a sala (distinto de omitir). */
export interface MoverAlocacaoInput {
  slotHorarioId?: string;
  salaId?: string | null;
  /** Versão que o cliente viu (concorrência otimista). Ausente = sem checagem —
   * o UPDATE segue como antes. Presente e divergente = a linha mudou no meio
   * tempo: o repositório recusa (409), sem sobrescrever o trabalho da outra pessoa. */
  versaoBase?: number;
}

/** Resultado de uma escrita de alocação, com o período afetado para recálculo. */
export interface AlocacaoAlterada {
  id: string;
  periodoLetivoId: string;
}

export const ALOCACOES_REPOSITORY = Symbol('ALOCACOES_REPOSITORY');
export interface AlocacoesRepository {
  criar(input: CriarAlocacaoInput): Promise<AlocacaoAlterada>;
  mover(id: string, input: MoverAlocacaoInput): Promise<AlocacaoAlterada>;
  /** `versaoBase` ausente = remove sem checar; presente e divergente = 409. */
  remover(id: string, versaoBase?: number): Promise<AlocacaoAlterada>;
  /** Período da oferta, para a trava de escrita ANTES de criar. `null` se a
   * oferta não existe. */
  periodoDaOferta(ofertaId: string): Promise<string | null>;
  /** Período da alocação, para a trava de escrita ANTES de mover/remover. `null`
   * se a alocação não existe. */
  periodoDaAlocacao(id: string): Promise<string | null>;
}

/** Resumo público de um período com grade publicada — sem o `id` interno. */
export interface PeriodoPublicadoResumo {
  codigo: string;
  descricao: string | null;
  ano: number;
  semestre: number;
  dataInicio: string;
  dataFim: string;
}

/** Resolução do período ativo para o motor de conflitos. */
export const PERIODOS_REPOSITORY = Symbol('PERIODOS_REPOSITORY');
export interface PeriodosRepository {
  /** Id do período marcado como ativo, ou `null` se não houver. */
  ativoId(): Promise<string | null>;
  /**
   * O snapshot da grade gravado na última publicação desse código, só se o
   * status atual for PUBLICADO; `null` se o código não existe, não está
   * publicado, ou nunca foi publicado (snapshot ainda não gravado).
   */
  snapshotPublicadoPorCodigo(
    codigo: string,
  ): Promise<Record<string, unknown> | null>;
  /** Todos os períodos com status PUBLICADO, do mais recente para o mais antigo. */
  listarPublicados(): Promise<PeriodoPublicadoResumo[]>;
}

/** As regras do motor, injetadas para que a lista seja configurável no módulo. */
export const REGRAS = Symbol('REGRAS');
export type Regras = Regra[];
