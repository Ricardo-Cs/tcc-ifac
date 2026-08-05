/**
 * A identidade estável de um conflito. É o ÚNICO elo entre a decisão da comissão
 * (registrada em `conflito_aceito`) e o conflito recalculado do zero a cada
 * reavaliação. TypeScript puro — sem TypeORM, sem `infrastructure`.
 *
 * Três propriedades garantidas aqui, e só aqui (nenhuma regra monta a string à
 * mão — a centralização é o que mantém a ordenação consistente entre regras):
 *
 *  1. Independe da ordem: o conflito entre A e B é o mesmo que entre B e A. Os
 *     participantes são serializados e ORDENADOS por um critério total.
 *  2. Expira quando o contexto muda: como o participante entra por `oferta+slot`
 *     (nunca pelo id da linha), mover uma aula muda o slot, muda a chave, e o
 *     aceite antigo deixa de casar — o conflito reaparece para nova avaliação.
 *  3. Sobrevive ao recálculo: mesma situação => mesma chave, sem depender de ids
 *     de linha que o UPDATE preserva.
 *
 * Formato: `tipo :: contexto :: participantesOrdenados`.
 */
import { Conflito, ParticipanteConflito } from './conflito';

// Separadores distintos e sem colisão: ids são UUIDs (só hex e hífen), então
// nenhum deles aparece dentro de um id.
const SEP_CAMPO = '::'; // entre tipo, contexto e participantes
const SEP_CONTEXTO = '|'; // entre partes do contexto
const SEP_PARTICIPANTES = ','; // entre participantes
const SEP_COORD = '@'; // entre as coordenadas de um participante
const SEM_SALA = 'sem-sala'; // sala considerada pela regra, mas indefinida (null)

function serializarParticipante(p: ParticipanteConflito): string {
    const coords = [p.ofertaId, p.slotId];
    // salaId ausente (undefined) = regra não considera sala; presente (string|null)
    // = considera, e null vira sentinela para não colidir com "sem coordenada".
    if (p.salaId !== undefined) {
        coords.push(p.salaId ?? SEM_SALA);
    }
    return coords.join(SEP_COORD);
}

/**
 * Deriva a chave de identidade de um conflito. Recebe só o que define a
 * identidade (`tipo`, `contexto`, `participantes`) — severidade fica de fora de
 * propósito: o mesmo conflito pode mudar de severidade conforme o contexto (ex.:
 * codocência) sem deixar de ser o mesmo conflito.
 */
export function chaveConflito(
    conflito: Pick<Conflito, 'tipo' | 'contexto' | 'participantes'>,
): string {
    const participantes = conflito.participantes
        .map(serializarParticipante)
        .sort()
        .join(SEP_PARTICIPANTES);
    const contexto = conflito.contexto.join(SEP_CONTEXTO);
    return [conflito.tipo, contexto, participantes].join(SEP_CAMPO);
}
