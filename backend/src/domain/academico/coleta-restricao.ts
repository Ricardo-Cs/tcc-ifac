export interface ColetaRestricao {
  id: string;
  periodoLetivoId: string;
  importadoEm: Date;
  importadoPorId: string;
  importadoPorNome: string;
  arquivoOrigem: string | null;
}

export interface CriarColetaRestricaoInput {
  periodoLetivoId: string;
  importadoPorId: string;
  arquivoOrigem?: string | null;
}

export const COLETAS_RESTRICAO_REPOSITORY = Symbol(
  'COLETAS_RESTRICAO_REPOSITORY',
);
export interface ColetasRestricaoRepository {
  buscarPorPeriodo(periodoLetivoId: string): Promise<ColetaRestricao | null>;
  criar(input: CriarColetaRestricaoInput): Promise<ColetaRestricao>;
  /** `false` quando não existe coleta com esse id. Remove em cascata as restrições do período. */
  remover(id: string): Promise<boolean>;
}
