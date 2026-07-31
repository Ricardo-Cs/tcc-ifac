/**
 * Tipos do resultado do motor de conflitos. TypeScript puro — não importa
 * TypeORM, NestJS nem nada de `infrastructure`. Esta é a fonte da verdade dos
 * enums; a camada de persistência (as entidades) os re-exporta a partir daqui.
 */

export enum SeveridadeConflito {
    /** Colisão certa — o mesmo recurso ocupado duas vezes. */
    FORTE = 'FORTE',
    /** Incerteza estrutural da codocência — a comissão avalia. */
    POTENCIAL = 'POTENCIAL',
    /** Preferência violada — não impede a grade, apenas sinaliza. */
    FRACO = 'FRACO',
}

export enum TipoConflito {
    // Fortes — colisão certa
    PROFESSOR_DUPLICADO = 'PROFESSOR_DUPLICADO',
    TURMA_DUPLICADA = 'TURMA_DUPLICADA',
    SALA_OCUPADA = 'SALA_OCUPADA',
    RESTRICAO_VIOLADA = 'RESTRICAO_VIOLADA',
    CARGA_SEMANAL_EXCEDIDA = 'CARGA_SEMANAL_EXCEDIDA',

    // Potenciais — incerteza estrutural (codocência)
    PROFESSOR_DUPLICADO_POTENCIAL = 'PROFESSOR_DUPLICADO_POTENCIAL',

    // Avisos / fracos
    RESTRICAO_NAO_IMPORTADA = 'RESTRICAO_NAO_IMPORTADA',
    CARGA_OFERTA_INCOMPLETA = 'CARGA_OFERTA_INCOMPLETA',
    CAPACIDADE_SALA_INSUFICIENTE = 'CAPACIDADE_SALA_INSUFICIENTE',
    TIPO_SALA_INADEQUADO = 'TIPO_SALA_INADEQUADO',
    HORARIO_NAO_PREFERIDO = 'HORARIO_NAO_PREFERIDO',
}

/**
 * Um conflito detectado. Nunca é persistido — é sempre recalculado a partir do
 * estado atual da grade. `tipo` e `severidade` são independentes de propósito:
 * o mesmo tipo pode ter severidades diferentes conforme o contexto (ver
 * PROFESSOR_DUPLICADO com codocência), e quem decide a severidade é a regra,
 * em tempo de avaliação.
 */
export interface Conflito {
    tipo: TipoConflito;
    severidade: SeveridadeConflito;
    /** Ids das alocações envolvidas na colisão. */
    alocacoesEnvolvidas: string[];
    /** Mensagem legível pela comissão de horários. */
    mensagem: string;
}

/**
 * Identidade estável de um conflito: `${tipo}|${alocações ordenadas}`.
 *
 * É por ela que o motor reconhece, a cada reavaliação (sempre recalculada do
 * zero), que um conflito recomputado é o MESMO que a comissão já aceitou — a
 * severidade fica de fora de propósito, pois pode mudar de contexto sem mudar a
 * identidade do conflito.
 *
 * A ordenação torna a chave independente da ordem em que a regra listou as
 * alocações. Efeito desejável: se a comissão mover uma das aulas envolvidas, o
 * conjunto muda, a chave muda e um eventual aceite deixa de casar — o conflito
 * reaparece, porque o contexto que justificou o aceite mudou.
 */
export function chaveConflito(
    conflito: Pick<Conflito, 'tipo' | 'alocacoesEnvolvidas'>,
): string {
    const alocacoes = [...conflito.alocacoesEnvolvidas].sort();
    return `${conflito.tipo}|${alocacoes.join(',')}`;
}
