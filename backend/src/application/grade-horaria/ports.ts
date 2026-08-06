/**
 * Portas (interfaces) da camada de aplicação para o motor de conflitos. O
 * domínio é puro e não sabe carregar nada; a aplicação orquestra, e depende
 * DESTAS interfaces — nunca de implementações concretas de `infrastructure`.
 * A ligação (qual classe implementa cada porta) é feita no módulo Nest, por
 * token de injeção. Assim o domínio + a orquestração continuam testáveis sem
 * banco: basta uma implementação em memória das portas.
 */
import { DadosSnapshot } from '../../domain/grade-horaria/snapshot';
import { StatusPeriodo } from '../../domain/comum/enums';
import { Regra } from '../../domain/grade-horaria/regras/regra';

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
  remover(id: string): Promise<AlocacaoAlterada>;
}

/** Resolução de usuário. No protótipo (sem auth) resolve um autor padrão para
 * `criadoPor`/`aceitoPor`; quando a autenticação entrar, o autor virá do token. */
export const USUARIOS_REPOSITORY = Symbol('USUARIOS_REPOSITORY');
export interface UsuariosRepository {
  padraoId(): Promise<string | null>;
}

/** Resumo de um período letivo para navegação/seleção na interface. */
export interface PeriodoResumo {
  id: string;
  codigo: string;
  descricao: string | null;
  status: StatusPeriodo;
  ativo: boolean;
}

/** Consulta de períodos (listagem e resolução do período ativo). */
export const PERIODOS_REPOSITORY = Symbol('PERIODOS_REPOSITORY');
export interface PeriodosRepository {
  listar(): Promise<PeriodoResumo[]>;
  /** Id do período marcado como ativo, ou `null` se não houver. */
  ativoId(): Promise<string | null>;
}

/** As regras do motor, injetadas para que a lista seja configurável no módulo. */
export const REGRAS = Symbol('REGRAS');
export type Regras = Regra[];
