/**
 * O funil de domínio para a comissão ACEITAR um conflito. TypeScript puro — o
 * serviço de aplicação chama `chaveDoAceite` antes de gravar em
 * `conflito_aceito`, e é aqui que mora a invariante: conflito FORTE nunca é
 * aceitável.
 */
import { chaveConflito } from './chave-conflito';
import { Conflito, SeveridadeConflito } from './conflito';

/**
 * Conflito FORTE é colisão certa (mesmo recurso ocupado duas vezes) — não é uma
 * situação que a comissão possa "conviver e seguir". Tentar aceitá-lo é erro de
 * domínio, não um caminho válido do fluxo.
 */
export class ConflitoForteNaoAceitavelError extends Error {
    constructor(public readonly conflito: Conflito) {
        super(
            `Conflito FORTE não é aceitável (${conflito.tipo}): resolva a colisão ` +
                `em vez de aceitá-la.`,
        );
        this.name = 'ConflitoForteNaoAceitavelError';
    }
}

/**
 * Deriva a chave de match de um conflito que a comissão quer aceitar, rejeitando
 * os FORTES. Ponto único de entrada para criar um aceite: quem persiste usa a
 * chave devolvida aqui, então a validação não tem como ser contornada.
 */
export function chaveDoAceite(conflito: Conflito): string {
    if (conflito.severidade === SeveridadeConflito.FORTE) {
        throw new ConflitoForteNaoAceitavelError(conflito);
    }
    return chaveConflito(conflito);
}
