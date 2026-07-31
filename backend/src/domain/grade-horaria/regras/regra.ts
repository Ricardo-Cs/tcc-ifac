import { Conflito, TipoConflito } from '../conflito';
import { GradeSnapshot } from '../snapshot';

/**
 * Uma regra de conflito. FUNÇÃO PURA sobre o snapshot: sem async, sem injeção
 * de dependência, sem acesso a banco. Recebe o estado em memória e devolve os
 * conflitos que encontrou.
 *
 * É o que torna os testes triviais — monta-se um snapshot literal e verifica-se
 * a saída, sem banco, sem mock, sem TestingModule do Nest.
 */
export interface Regra {
    /** O tipo "base" da regra. A severidade concreta é decidida na avaliação. */
    readonly tipo: TipoConflito;
    avaliar(snapshot: GradeSnapshot): Conflito[];
}
