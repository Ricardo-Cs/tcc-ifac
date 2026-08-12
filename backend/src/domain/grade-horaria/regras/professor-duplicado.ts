import {
  Conflito,
  ParticipanteConflito,
  SeveridadeConflito,
  TipoConflito,
} from '../conflito';
import { AlocacaoSnapshot, GradeSnapshot } from '../snapshot';
import { Regra } from './regra';

/**
 * PROFESSOR_DUPLICADO — o mesmo professor envolvido em duas ou mais ofertas
 * DISTINTAS alocadas no mesmo slot.
 *
 * SEMPRE o tipo PROFESSOR_DUPLICADO; o que muda é a SEVERIDADE, decidida em
 * runtime pela PROPORÇÃO DE CARGA do professor nas ofertas em colisão:
 *   - 100% em TODAS as ofertas envolvidas -> FORTE (colisão certa: o professor
 *     é o responsável integral pelas duas aulas ao mesmo tempo)
 *   - menos de 100% em QUALQUER uma       -> POTENCIAL (codocência: 70/30, três
 *     professores dividindo — pode ser resolvível internamente; a comissão avalia)
 *
 * A potencialidade é severidade, não tipo — por isso não vira um valor de enum
 * à parte. Manter o tipo fixo é o que preserva a chave de identidade quando o
 * mesmo conflito oscila FORTE<->POTENCIAL sem a aula mudar de slot (a severidade
 * fica de fora de `chaveConflito`, então o aceite sobrevive à transição).
 *
 * Comparar ofertas distintas, não alocações: duas alocações da MESMA oferta no
 * mesmo slot são a mesma aula (o professor está num lugar só) — isso é problema
 * de TURMA_DUPLICADA, não deste. Por isso reunimos por oferta antes de comparar.
 */
export class RegraProfessorDuplicado implements Regra {
  readonly tipo = TipoConflito.PROFESSOR_DUPLICADO;

  avaliar(snapshot: GradeSnapshot): Conflito[] {
    const conflitos: Conflito[] = [];

    for (const [chave, alocacoes] of snapshot.porProfessorSlot) {
      // Ofertas distintas alocadas neste slot que incluem este professor.
      // Dedup por oferta: a MESMA oferta duas vezes no slot é uma aula só.
      const ofertaIds = new Set(alocacoes.map((a) => a.ofertaId));
      if (ofertaIds.size < 2) continue;

      // chave = `${professorId}:${slotId}`
      const [professorId, slotId] = chave.split(':');
      const professor = snapshot.professores.get(professorId);
      const slot = snapshot.slots.get(slotId);
      const nomeProfessor = professor?.nome ?? professorId;
      const nomeSlot = slot?.codigo ?? slotId;

      // Coordenadas semânticas: as ofertas distintas deste professor neste
      // slot. O professorId entra no contexto — em codocência, dois
      // professores nas MESMAS ofertas/slot são dois conflitos distintos
      // (um por professor); sem ele no contexto, as duas chaves colidiriam.
      const participantes = [...ofertaIds].map((ofertaId) => ({
        ofertaId,
        slotId,
      }));
      const contexto = [professorId, slotId];

      // FORTE só quando o professor detém 100% da carga em TODAS as ofertas
      // em colisão. Qualquer proporção < 100 (codocência) rebaixa a POTENCIAL:
      // a carga pode estar repartida de modo que a comissão resolva internamente.
      const cargaIntegralEmTodas = [...ofertaIds].every(
        (id) => proporcaoDoProfessor(snapshot, id, professorId) >= 100,
      );

      conflitos.push(
        cargaIntegralEmTodas
          ? this.forte(
              nomeProfessor,
              nomeSlot,
              alocacoes,
              participantes,
              contexto,
            )
          : this.potencial(
              nomeProfessor,
              nomeSlot,
              alocacoes,
              participantes,
              contexto,
            ),
      );
    }

    return conflitos;
  }

  private forte(
    professor: string,
    slot: string,
    alocacoes: AlocacaoSnapshot[],
    participantes: ParticipanteConflito[],
    contexto: string[],
  ): Conflito {
    return {
      tipo: TipoConflito.PROFESSOR_DUPLICADO,
      severidade: SeveridadeConflito.FORTE,
      participantes,
      contexto,
      alocacoesEnvolvidas: alocacoes.map((a) => a.id),
      // Aviso curto: quem e onde. O tipo do conflito já aparece ao lado na tela.
      mensagem: `${professor} em duas aulas no horário ${slot}.`,
    };
  }

  private potencial(
    professor: string,
    slot: string,
    alocacoes: AlocacaoSnapshot[],
    participantes: ParticipanteConflito[],
    contexto: string[],
  ): Conflito {
    return {
      // Mesmo tipo do caso FORTE — só a severidade difere. Assim a chave é
      // idêntica e o aceite sobrevive à oscilação de severidade.
      tipo: TipoConflito.PROFESSOR_DUPLICADO,
      severidade: SeveridadeConflito.POTENCIAL,
      participantes,
      contexto,
      alocacoesEnvolvidas: alocacoes.map((a) => a.id),
      // Aviso curto: o "pode" já sinaliza o caráter potencial; codocência é o motivo.
      mensagem: `${professor} pode conflitar no horário ${slot} (codocência).`,
    };
  }
}

/**
 * Proporção de carga (0–100) do professor na oferta. Ausência da oferta no
 * snapshot, ou do professor entre seus participantes, conta como 0 — não como
 * 100: sem dado de carga não se afirma colisão certa, então o conflito não deve
 * ser rebaixado para FORTE por omissão.
 */
function proporcaoDoProfessor(
  snapshot: GradeSnapshot,
  ofertaId: string,
  professorId: string,
): number {
  const participacao = snapshot.ofertas
    .get(ofertaId)
    ?.professores.find((p) => p.professorId === professorId);
  return participacao?.proporcaoCarga ?? 0;
}
