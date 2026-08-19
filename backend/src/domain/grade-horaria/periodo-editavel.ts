/**
 * Regra de escrita da grade: só o período CORRENTE (o marcado como ativo) aceita
 * alterações. Período passado é histórico — a comissão o consulta, não o edita.
 *
 * O front já trata período não-corrente como somente-leitura (desliga arraste e
 * remover); esta regra é a mesma trava do lado do servidor, para que a leitura
 * da tela e a garantia real coincidam — sem ela, um PATCH/POST direto na API
 * ainda escreveria num período fechado.
 *
 * Vive no domínio (TypeScript puro, sem Nest) porque é regra de negócio; a
 * tradução do erro para HTTP fica na camada de aplicação.
 */
export class PeriodoFechadoParaEdicaoError extends Error {
  constructor() {
    super(
      'Período fechado para edição: só o período corrente aceita alterações.',
    );
    this.name = 'PeriodoFechadoParaEdicaoError';
  }
}

/**
 * Garante que o período alvo da escrita é o corrente. `ativoId` é o id do período
 * marcado como ativo (ou `null` se não houver nenhum — nesse caso nada é
 * editável). Lança `PeriodoFechadoParaEdicaoError` quando não batem.
 */
export function garantirPeriodoEditavel(
  periodoId: string,
  ativoId: string | null,
): void {
  if (periodoId !== ativoId) {
    throw new PeriodoFechadoParaEdicaoError();
  }
}
