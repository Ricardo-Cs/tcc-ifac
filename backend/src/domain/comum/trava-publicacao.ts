export class PublicacaoComConflitoForteError extends Error {
  constructor() {
    super(
      'Não é possível publicar: existem conflitos fortes não resolvidos neste período.',
    );
    this.name = 'PublicacaoComConflitoForteError';
  }
}

export function garantirPodePublicar(temConflitoForte: boolean): void {
  if (temConflitoForte) {
    throw new PublicacaoComConflitoForteError();
  }
}

export const CONFLITOS_PERIODO_CHECKER = Symbol('CONFLITOS_PERIODO_CHECKER');
export interface ConflitosPeriodoChecker {
  existeConflitoForte(periodoLetivoId: string): Promise<boolean>;
}
