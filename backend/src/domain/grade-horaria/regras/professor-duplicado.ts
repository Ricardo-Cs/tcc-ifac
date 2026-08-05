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
 * runtime pela codocência:
 *   - todas as ofertas envolvidas têm um único professor  -> FORTE (colisão certa)
 *   - alguma oferta envolvida tem codocência               -> POTENCIAL
 *     (pode ser resolvível internamente; a comissão avalia)
 *
 * A potencialidade é severidade, não tipo — por isso não vira um valor de enum
 * à parte. Manter o tipo fixo é o que preserva a chave de identidade quando o
 * mesmo conflito oscila FORTE<->POTENCIAL sem a aula mudar de slot.
 *
 * Comparar ofertas distintas, não alocações: duas alocações da MESMA oferta no
 * mesmo slot são a mesma aula (o professor está num lugar só) — isso é problema
 * de TURMA_DUPLICADA, não deste.
 */
export class RegraProfessorDuplicado implements Regra {
    readonly tipo = TipoConflito.PROFESSOR_DUPLICADO;

    avaliar(snapshot: GradeSnapshot): Conflito[] {
        const conflitos: Conflito[] = [];

        for (const [chave, alocacoes] of snapshot.porProfessorSlot) {
            // Ofertas distintas alocadas neste slot que incluem este professor.
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

            const haCodocencia = [...ofertaIds].some((id) => {
                const oferta = snapshot.ofertas.get(id);
                return (oferta?.professorIds.length ?? 0) > 1;
            });

            conflitos.push(
                haCodocencia
                    ? this.potencial(nomeProfessor, nomeSlot, alocacoes, participantes, contexto)
                    : this.forte(nomeProfessor, nomeSlot, alocacoes, participantes, contexto),
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
            mensagem:
                `O professor ${professor} está em mais de uma aula no mesmo horário ` +
                `(${slot}).`,
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
            mensagem:
                `O professor ${professor} pode ter conflito no horário ${slot}: há ` +
                `codocência em pelo menos uma das ofertas, então a comissão avalia.`,
        };
    }
}
