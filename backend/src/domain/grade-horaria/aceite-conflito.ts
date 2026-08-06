/**
 * O funil de domínio para a comissão ACEITAR um conflito. TypeScript puro — o
 * serviço de aplicação chama `chaveDoAceite` antes de gravar em
 * `conflito_aceito`, e é aqui que mora a invariante: conflito FORTE nunca é
 * aceitável.
 */
import { chaveConflito } from './chave-conflito';
import { Conflito, SeveridadeConflito } from './conflito';

export class ConflitoForteNaoAceitavelError extends Error {
  constructor(public readonly conflito: Conflito) {
    super(
      `Conflito FORTE não é aceitável (${conflito.tipo}): resolva a colisão ` +
        `em vez de aceitá-la.`,
    );
    this.name = 'ConflitoForteNaoAceitavelError';
  }
}

export function chaveDoAceite(conflito: Conflito): string {
  if (conflito.severidade === SeveridadeConflito.FORTE) {
    throw new ConflitoForteNaoAceitavelError(conflito);
  }
  return chaveConflito(conflito);
}
