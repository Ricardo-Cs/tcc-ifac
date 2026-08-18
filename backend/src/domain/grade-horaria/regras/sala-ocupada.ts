import { Conflito, SeveridadeConflito, TipoConflito } from '../conflito';
import { GradeSnapshot } from '../snapshot';
import { Regra } from './regra';

/**
 * SALA_OCUPADA — a mesma sala com duas OFERTAS distintas no mesmo slot.
 *
 * Sempre conflito FORTE: uma sala é um recurso físico e não comporta duas aulas
 * diferentes ao mesmo tempo. Diferente de PROFESSOR_DUPLICADO, aqui não há
 * gradação por codocência — o espaço é indivisível.
 *
 * Conta ofertas distintas, não alocações — simétrico às regras de professor e
 * turma. Duas alocações da MESMA oferta na mesma sala/slot são a mesma aula
 * gravada duas vezes (duplicata de dados), não duas aulas disputando a sala;
 * isso é problema de CARGA_OFERTA_INCOMPLETA, não deste.
 *
 * Casos que NÃO são conflito, garantidos pela indexação:
 *  - Aulas SEM sala definida não entram em `porSalaSlot` — duas aulas sem sala
 *    no mesmo slot não disputam sala nenhuma.
 *  - A "sala dupla" (uma mesma oferta em LAB 3 E LAB 4 no mesmo slot) cai em
 *    dois buckets distintos (uma sala cada), então não acende — é intencional.
 *  - Aulas geminadas ocupam slots diferentes, logo buckets diferentes.
 */
export class RegraSalaOcupada implements Regra {
  readonly tipo = TipoConflito.SALA_OCUPADA;

  avaliar(snapshot: GradeSnapshot): Conflito[] {
    const conflitos: Conflito[] = [];

    for (const [chave, alocacoes] of snapshot.porSalaSlot) {
      // Ofertas distintas ocupando esta sala neste slot.
      const ofertaIds = new Set(alocacoes.map((a) => a.ofertaId));
      if (ofertaIds.size < 2) continue;

      // chave = `${salaId}:${slotId}`
      const [salaId, slotId] = chave.split(':');
      const sala = snapshot.salas.get(salaId);
      const slot = snapshot.slots.get(slotId);
      const nomeSala = sala?.nome ?? salaId;
      const nomeSlot = slot?.codigo ?? slotId;

      conflitos.push({
        tipo: TipoConflito.SALA_OCUPADA,
        severidade: SeveridadeConflito.FORTE,
        // Coordenadas semânticas: as ofertas distintas nesta sala/slot. A sala
        // entra na chave (salaId no participante e no contexto) porque uma mesma
        // oferta pode ocupar salas diferentes no mesmo slot (sala dupla) — sem
        // a sala no contexto, dois buckets de sala poderiam colidir na chave.
        participantes: [...ofertaIds].map((ofertaId) => ({
          ofertaId,
          slotId,
          salaId,
        })),
        contexto: [salaId, slotId],
        alocacoesEnvolvidas: alocacoes.map((a) => a.id),
        // Aviso curto: sala e horário. O tipo do conflito já aparece ao lado na tela.
        mensagem: `${nomeSala} com ${ofertaIds.size} aulas no horário ${nomeSlot}.`,
      });
    }

    return conflitos;
  }
}
