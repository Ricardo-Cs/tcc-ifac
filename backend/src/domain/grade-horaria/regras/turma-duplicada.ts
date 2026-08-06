import { Conflito, SeveridadeConflito, TipoConflito } from '../conflito';
import { GradeSnapshot } from '../snapshot';
import { Regra } from './regra';

/**
 * TURMA_DUPLICADA — a mesma turma com duas OFERTAS distintas no mesmo slot.
 *
 * Sempre conflito FORTE, sem exceção: a turma não se divide, então não pode
 * assistir a duas disciplinas ao mesmo tempo.
 *
 * Conta ofertas distintas, não alocações — simétrico à regra de professor.
 * Duas alocações da MESMA oferta no mesmo slot são a mesma aula gravada duas
 * vezes (duplicata de dados, clique duplo), não uma turma em duas disciplinas;
 * acusar TURMA_DUPLICADA aí seria diagnóstico errado. Esse excesso é sinalizado
 * por CARGA_OFERTA_INCOMPLETA (contagem de alocações != aulasSemana).
 *
 * Aulas geminadas não entram nesta conta: ocupam slots diferentes, logo caem em
 * buckets diferentes de `porTurmaSlot`.
 */
export class RegraTurmaDuplicada implements Regra {
  readonly tipo = TipoConflito.TURMA_DUPLICADA;

  avaliar(snapshot: GradeSnapshot): Conflito[] {
    const conflitos: Conflito[] = [];

    for (const [chave, alocacoes] of snapshot.porTurmaSlot) {
      // Ofertas distintas da turma alocadas neste slot.
      const ofertaIds = new Set(alocacoes.map((a) => a.ofertaId));
      if (ofertaIds.size < 2) continue;

      // chave = `${turmaId}:${slotId}`
      const [turmaId, slotId] = chave.split(':');
      const turma = snapshot.turmas.get(turmaId);
      const slot = snapshot.slots.get(slotId);
      const nomeTurma = turma?.nome ?? turmaId;
      const nomeSlot = slot?.codigo ?? slotId;

      conflitos.push({
        tipo: TipoConflito.TURMA_DUPLICADA,
        severidade: SeveridadeConflito.FORTE,
        // Coordenadas semânticas: as ofertas distintas neste slot. A turma
        // já é determinada pelas ofertas, então não precisa entrar no
        // contexto (basta o slot).
        participantes: [...ofertaIds].map((ofertaId) => ({ ofertaId, slotId })),
        contexto: [slotId],
        alocacoesEnvolvidas: alocacoes.map((a) => a.id),
        mensagem:
          `A turma ${nomeTurma} tem ${ofertaIds.size} disciplinas no mesmo ` +
          `horário (${nomeSlot}).`,
      });
    }

    return conflitos;
  }
}
