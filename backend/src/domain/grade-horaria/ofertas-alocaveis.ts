/**
 * Ofertas que ainda têm aula a pôr na grade — o catálogo de onde a comissão
 * arrasta uma disciplina para uma célula vazia. TypeScript puro, sem banco.
 *
 * A conta é simples e é a única lógica de negócio daqui: uma oferta deve ocupar
 * `aulasSemana` slots por semana; já ocupou tantos quantos forem as alocações
 * dela na grade; o que falta é a diferença. Só entram no catálogo as ofertas com
 * falta > 0 — as já completas (ou excedidas) não têm o que oferecer.
 *
 * Conta LINHAS de alocação, não slots distintos — mesma contagem que
 * CARGA_OFERTA_INCOMPLETA usa. Uma oferta com mais alocações que `aulasSemana`
 * (excesso) dá falta negativa e sai do catálogo: excesso é problema daquela
 * regra, não deste catálogo, que só lista o que ainda cabe.
 */
import { GradeSnapshot, Id } from './snapshot';

export interface OfertaComCargaRestante {
  ofertaId: Id;
  /** Slots que a oferta deve ocupar por semana. */
  aulasSemana: number;
  /** Alocações que a oferta já tem na grade. */
  aulasAlocadas: number;
  /** `aulasSemana - aulasAlocadas`, sempre > 0 (as demais são filtradas). */
  aulasRestantes: number;
}

export function ofertasAlocaveis(
  snapshot: GradeSnapshot,
): OfertaComCargaRestante[] {
  // Quantas alocações cada oferta já tem. Ofertas sem alocação nenhuma nem
  // aparecem no mapa — contam como 0, e é o que queremos.
  const alocadasPorOferta = new Map<Id, number>();
  for (const alocacao of snapshot.alocacoes) {
    alocadasPorOferta.set(
      alocacao.ofertaId,
      (alocadasPorOferta.get(alocacao.ofertaId) ?? 0) + 1,
    );
  }

  const alocaveis: OfertaComCargaRestante[] = [];
  for (const oferta of snapshot.ofertas.values()) {
    const aulasAlocadas = alocadasPorOferta.get(oferta.id) ?? 0;
    const aulasRestantes = oferta.aulasSemana - aulasAlocadas;
    if (aulasRestantes <= 0) continue;
    alocaveis.push({
      ofertaId: oferta.id,
      aulasSemana: oferta.aulasSemana,
      aulasAlocadas,
      aulasRestantes,
    });
  }
  return alocaveis;
}
